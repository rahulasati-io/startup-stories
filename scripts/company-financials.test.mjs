import test from 'node:test';
import assert from 'node:assert/strict';
import {financialColumnHeaders, parseCompanyFinancials, planAnnualFinancials, checkLegacyFinancialOverlap, financialYear} from './lib/company-financials.mjs';
import {prepareAnnualFinancials, saveAnnualFinancials} from './lib/import-annual-financials.mjs';

const headers = [...financialColumnHeaders(25), ...financialColumnHeaders(26)];
const base = {company_slug:'example', fy25_currency:'INR', fy25_unit:'Crore', fy25_reporting_basis:'Consolidated', fy25_source_url:'https://example.com/report', fy25_revenue:100};
const parse = row => parseCompanyFinancials([row], headers);

test('year groups stay separate, with numeric zero and losses preserved', () => {
  const items = parse({...base, fy25_ebitda:0, fy25_net_profit_loss:-40, fy26_currency:'USD', fy26_unit:'Million', fy26_reporting_basis:'Standalone', fy26_source_url:'https://example.com/fy26', fy26_revenue:5});
  assert.equal(items.length,4);
  assert.equal(items[0].value,'INR 100 crore');
  assert.equal(items[1].numericValue,0);
  assert.equal(items[2].numericValue,-40);
  assert.equal(items[3].currency,'USD');
  assert.equal(items[3].unit,'million');
  assert.equal(items[3].fiscalYear,2026);
});

test('empty groups and empty amounts do nothing', () => {
  assert.deepEqual(parse({company_slug:'example'}),[]);
  assert.deepEqual(parse({...base,fy25_revenue:'',fy25_ebitda:null}),[]);
  assert.deepEqual(planAnnualFinancials([], [{_id:'existing',numericValue:99}]),[]);
});

test('invalid values/context fail before an import can write', () => {
  for(const row of [{...base,fy25_currency:''},{...base,fy25_unit:''},{...base,fy25_reporting_basis:''},{...base,fy25_source_url:''},{...base,fy25_revenue:'INR 100 crore'},{...base,fy25_revenue:true},{...base,fy25_revenue:'1,2'},{...base,fy25_revenue:Infinity}]) assert.throws(()=>parse(row));
  assert.throws(()=>parseCompanyFinancials([base], [...headers,'fy25_revneue']));
  assert.throws(()=>parseCompanyFinancials([base,base],headers),/duplicate/);
});

test('future year columns and grouped numeric strings are supported', () => {
  const row={company_slug:'example',fy2027_currency:'EUR',fy2027_unit:'Units',fy2027_revenue:'1,23,456.75',fy2027_reporting_basis:'Standalone',fy2027_source_url:'https://example.com'};
  const items=parseCompanyFinancials([row],financialColumnHeaders(2027));
  assert.equal(items[0].numericValue,123456.75);
  assert.equal(items[0].fiscalYear,2027);
  assert.equal(financialYear('FY 2025–26, consolidated'),2026);
  assert.equal(financialYear('FY2025 (Consolidated)'),2025);
  assert.equal(financialYear('Q1 FY25'),null);
});

test('existing observation is reused and unchanged imports are skipped', () => {
  const input=parse(base)[0];
  const {companySlug,key,...data}=input;
  assert.equal(key,'example|FY2025|consolidated|revenue');
  const existing={_id:'generated-id',_rev:'revision',companySlug,...data,internalNotes:'Keep this'};
  const [operation]=planAnnualFinancials([input],[existing]);
  assert.equal(operation.existing._id,'generated-id');
  assert.equal(operation.changed,false);
  const [change]=planAnnualFinancials(parse({...base,fy25_revenue:200}),[existing]);
  assert.equal(change.changed,true);
  assert(!Object.hasOwn(change.data,'internalNotes'));
});

test('legacy overlap, unknown accounting basis, duplicates and drafts block', () => {
  const inputs=parse(base);
  const existing={_id:'old',companySlug:'example',label:'Revenue from operations',period:'FY2025',numericValue:100};
  assert.throws(()=>planAnnualFinancials(inputs,[existing]),/basis/);
  const withBasis={...existing,reportingBasis:'consolidated'};
  assert.throws(()=>planAnnualFinancials(inputs,[withBasis,{...withBasis,_id:'other'}]),/multiple/);
  assert.throws(()=>planAnnualFinancials(inputs,[{...withBasis,_id:'drafts.old'}]),/draft/);
  assert.throws(()=>checkLegacyFinancialOverlap(inputs,[{company_slug:'example',label:'Revenue',period:'FY25'}]),/both/);
  assert.doesNotThrow(()=>checkLegacyFinancialOverlap(inputs,[{company_slug:'example',label:'Occupancy',period:'FY25'}]));
});

test('changing shared currency/unit cannot reinterpret saved figures left blank', () => {
  const saved={_id:'profit',companySlug:'example',metricCode:'net_profit_loss',fiscalYear:2025,reportingBasis:'consolidated',currency:'USD',unit:'million'};
  assert.throws(()=>planAnnualFinancials(parse(base),[saved]),/currency\/unit/);
  assert.doesNotThrow(()=>planAnnualFinancials(parse(base),[{...saved,currency:'INR',unit:'crore'}]));
});

test('financials-only saving uses generated IDs and patches only metrics with revision guards', async () => {
  const input=parse(base)[0];
  const calls=[];
  const tx={create(doc){calls.push({type:'create',doc});return this;},patch(id,callback){const patch={ifRevisionId(rev){calls.push({type:'revision',rev});return this;},set(data){calls.push({type:'patch',id,data});return this;}};callback(patch);return this;},async commit(){calls.push({type:'commit'});}};
  let metrics=[];
  const client={transaction(){return tx;},async fetch(){return {company:{_id:'company-id',_rev:'c1',slug:'example'},controls:[],metrics};}};
  await saveAnnualFinancials(client,planAnnualFinancials([input],[]),{dryRun:true,companyIds:new Map([['example','company-id']])});
  assert.equal(calls.length,0);
  await saveAnnualFinancials(client,planAnnualFinancials([input],[]),{companyIds:new Map([['example','company-id']])});
  const created=calls.find(call=>call.type==='create').doc;
  assert.equal(created._type,'companyMetric');
  assert.equal(created.company._ref,'company-id');
  assert(!Object.hasOwn(created,'_id'));
  calls.length=0;
  const existing={_id:'metric-id',_rev:'r1',companySlug:'example',label:'Revenue',period:'FY25',reportingBasis:'consolidated'};
  metrics=[existing];
  await saveAnnualFinancials(client,planAnnualFinancials([input],[existing]),{companyIds:new Map([['example','company-id']])});
  assert(calls.some(call=>call.type==='revision'&&call.rev==='r1'));
  const updated=calls.find(call=>call.type==='patch'&&call.id==='metric-id');
  assert(updated);
  assert(!Object.hasOwn(updated.data,'bio'));
});

test('financials preflight checks published company identity before any mutation', async () => {
  const calls=[];
  const client={async fetch(query,params,options){calls.push({query,params,options});return query.includes('_type == "company"')?[{_id:'company-id',_rev:'c1',slug:'example',controls:[]}]:[];}};
  const operations=await prepareAnnualFinancials(client,parse(base));
  assert.equal(operations.length,1);
  assert.deepEqual(calls[1].params.ids,['company-id']);
  const missing={async fetch(){return [];}};
  await assert.rejects(()=>prepareAnnualFinancials(missing,parse(base)),/not published/);
  assert.equal((await prepareAnnualFinancials(missing,parse(base),{allowMissingCompanies:true})).length,1);
});

test('one-row-per-company planning supports 6000 companies without merging identities', () => {
  const rows=Array.from({length:6000},(_,i)=>({...base,company_slug:`company-${i}`}));
  const observations=parseCompanyFinancials(rows,headers);
  const records=observations.map(({companySlug,key,...data},index)=>({...data,companySlug,_id:`id-${index}`,_rev:'r1',financialImportKey:key}));
  const operations=planAnnualFinancials(observations,records);
  assert.equal(operations.length,6000);
  assert(operations.every(operation=>operation.changed)); // Different legacy import keys are safely updated in place.
  assert.equal(new Set(operations.map(operation=>operation.existing._id)).size,6000);
});
