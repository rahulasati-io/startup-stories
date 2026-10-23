import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import XLSX from 'xlsx';
import {parseCompanyFunding,fundingColumnHeaders,fundingDate} from './lib/company-funding.mjs';
import {planFundingImports,saveFundingImports} from './lib/import-company-funding.mjs';

const headers=['company_slug','company_name',...fundingColumnHeaders(1),...fundingColumnHeaders(2)];
const row={company_slug:'example',round_1_type:'Series A',round_1_date:'2026-10-22',round_1_amount:5,round_1_currency:'USD',round_1_unit:'Million',round_1_investors:'Investor A, Investor B; Investor A'};
const companies=[{_id:'c',slug:'example'}];
const parse=rows=>parseCompanyFunding(rows,headers,{companySlugs:new Set(['example'])});

test('one company row expands into independent rounds, converts scale without FX, splits investors',()=>{
  const rounds=parse([{...row,round_2_type:'Seed',round_2_amount:12.5,round_2_currency:'INR',round_2_unit:'Crore'}]);
  assert.equal(rounds.length,2);
  assert.equal(rounds[0].amount,5e6);
  assert.equal(rounds[1].amount,125e6);
  assert.equal(rounds[1].currency,'INR');
  assert.deepEqual(rounds[0].investors,['Investor A','Investor B']);
  assert.equal(rounds[0].importKey,'funding:slot:1');
});

test('blank blocks/company reserve rows and currency selections alone create nothing',()=>{
  assert.deepEqual(parse([{company_slug:'example',round_1_currency:'INR',round_1_unit:'Crore'},{company_slug:'',company_name:''}]),[]);
  assert.equal(parse([{company_slug:'example',round_1_type:'Seed'}])[0].amount,undefined);
  assert.equal(parse([{...row,round_1_amount:0}])[0].amount,0);
});

test('rejects malformed dates, amounts, scales and incomplete/unknown company rows',()=>{
  for(const overrides of [
    {round_1_date:'2026-02-30'}, {round_1_date:'22/10/2026'}, {round_1_amount:-5}, {round_1_amount:'$5m'},
    {round_1_amount:true}, {round_1_currency:'BAD'}, {round_1_unit:'unknown'}, {round_1_type:''},
    {company_slug:'missing'}, {company_slug:''},
  ])assert.throws(()=>parse([{...row,...overrides}]));
  assert.equal(fundingDate(46317,'test'),'2026-10-22');
  assert.equal(fundingDate(new Date('2026-10-22T00:00:00Z'),'test'),'2026-10-22');
});

test('allows new round blocks beyond five, but rejects duplicate company/event/column identities',()=>{
  assert.equal(parseCompanyFunding([{company_slug:'example',round_6_type:'Series F'}],['company_slug',...fundingColumnHeaders(6)])[0].slot,6);
  assert.throws(()=>parse([row,row]),/one row per company/);
  assert.throws(()=>parse([{...row,round_2_type:'Series A',round_2_date:row.round_1_date}]),/already entered/);
  assert.throws(()=>parseCompanyFunding([row],[...headers,'round_1_amount']),/duplicate/);
  assert.throws(()=>parseCompanyFunding([row],[...headers,'round_1_purpose']),/unsupported/);
});

test('stable company and slot identity survives row reorder, changed dates and corrected amounts',()=>{
  const input=parse([row])[0];
  const existing={_id:'saved',_rev:'r1',company:{_ref:'c'},round:'Series A',date:'2026-10-21',amount:1,fundingImportKey:input.importKey};
  const operation=planFundingImports([input],companies,[existing])[0];
  assert.equal(operation.existing._id,'saved');
  assert.equal(operation.data.amount,5e6);
  assert.equal(operation.data.date,'2026-10-22');
});

test('adopts an unkeyed saved round rather than duplicating it; preserves unrelated fields',()=>{
  const input=parse([row])[0];
  const existing={_id:'legacy-id',_rev:'r1',company:{_ref:'c'},round:'Series A',date:input.date,notes:'Editorial notes',sourceUrl:'https://example.com'};
  const operation=planFundingImports([input],companies,[existing])[0];
  assert.equal(operation.existing._id,'legacy-id');
  assert.equal(operation.data.fundingImportKey,input.importKey);
  assert.ok(!('notes' in operation.data));
  assert.ok(!('sourceUrl' in operation.data));
});

test('blank optional values never clear an existing amount/date/investor list',()=>{
  const input=parse([{company_slug:'example',round_1_type:'Seed'}])[0];
  const operation=planFundingImports([input],companies,[{_id:'saved',company:{_ref:'c'},fundingImportKey:input.importKey,round:'Seed',amount:100,date:'2020-01-01',investors:['Existing']}])[0];
  assert.equal(operation.changed,false);
  for(const key of ['amount','date','investors'])assert.ok(!(key in operation.data));
  assert.throws(()=>planFundingImports([{...input,currency:'INR'}],companies,[{_id:'saved',company:{_ref:'c'},fundingImportKey:input.importKey,round:'Seed',amount:100,currency:'USD'}]),/changing its currency/);
});

test('blocks ambiguous rounds, moved blocks, overlapping identities and unpublished draft changes',()=>{
  const input=parse([row])[0];
  const saved={_id:'saved',company:{_ref:'c'},round:input.round,date:input.date};
  assert.throws(()=>planFundingImports([input],companies,[saved,{...saved,_id:'duplicate'}]),/multiple saved/);
  assert.throws(()=>planFundingImports([input],companies,[{...saved,fundingImportKey:'funding:slot:2'}]),/block numbers/);
  assert.throws(()=>planFundingImports([input],companies,[saved,{...saved,_id:'drafts.saved',round:'Changed title',date:'2026-01-01'}]),/draft/);
  assert.throws(()=>planFundingImports([input],companies,[{...saved,fundingImportKey:input.importKey},{...saved,_id:'other'}]),/duplicate another/);
  assert.throws(()=>planFundingImports([input],[...companies,...companies],[]),/Multiple company/);
});

function mockClient(){
  let version=1,nextId=1;const records=[];let commits=0;
  return {records,get commits(){return commits;},async fetch(query){return query.includes('fundingRound')?structuredClone(records):{_id:'c',_rev:String(version)};},transaction(){
    const patches=[],creates=[];
    const tx={patch(id,callback){const data={id};const patch={ifRevisionId(rev){data.rev=rev;return patch;},set(value){data.value=value;return patch;}};callback(patch);patches.push(data);return tx;},create(data){creates.push(data);return tx;},async commit(){
      for(const patch of patches){const current=patch.id==='c'?String(version):records.find(record=>record._id===patch.id)?._rev;if(current!==patch.rev)throw Error('Revision conflict');}
      for(const patch of patches)if(patch.id!=='c')Object.assign(records.find(record=>record._id===patch.id),patch.value,{_rev:String(version+1)});
      for(const data of creates)records.push({...data,_id:`generated-${nextId++}`,_rev:String(version+1)});
      version++;commits++;
    }};return tx;
  }};
}

test('dry run writes nothing, normal import is idempotent and corrections patch the same generated ID',async()=>{
  const client=mockClient(),input=parse([row])[0],operations=planFundingImports([input],companies,[]),opts={companyIds:new Map([['example','c']])};
  await saveFundingImports(client,operations,{...opts,dryRun:true});assert.equal(client.commits,0);
  await saveFundingImports(client,operations,opts);assert.equal(client.records.length,1);
  await saveFundingImports(client,operations,opts);assert.equal(client.commits,1);
  const updated={...input,amount:6e6};await saveFundingImports(client,planFundingImports([updated],companies,client.records),opts);
  assert.equal(client.records[0]._id,'generated-1');assert.equal(client.records[0].amount,6e6);assert.equal(client.records.length,1);
});

test('company revision guard prevents duplicate creation during concurrent imports',async()=>{
  const client=mockClient(),operations=planFundingImports(parse([row]),companies,[]),opts={companyIds:new Map([['example','c']])};
  await Promise.allSettled([saveFundingImports(client,operations,opts),saveFundingImports(client,operations,opts)]);
  assert.equal(client.records.length,1);
});

test('current workbook covers every company, with five blocks and spare rows, without publishing',()=>{
  if(!fs.existsSync('companies.xlsx'))return;
  const workbook=XLSX.readFile('companies.xlsx');
  const funding=workbook.Sheets['Funding Rounds'];
  const companyRows=XLSX.utils.sheet_to_json(workbook.Sheets.Companies);
  const values=XLSX.utils.sheet_to_json(funding,{defval:''});
  const actual=values.filter(row=>row.company_slug);
  const h=XLSX.utils.sheet_to_json(funding,{header:1})[0];
  assert.deepEqual(actual.map(row=>row.company_slug),companyRows.map(row=>row.company_slug));
  assert.equal(h.length,32);
  assert.ok(XLSX.utils.decode_range(funding['!ref']).e.r>=500);
  assert.equal(funding.AF1.v,'round_5_investors');
  assert.equal(funding.B234.f?.includes('MATCH(A234'),true);
  assert.equal(parseCompanyFunding(values,h,{companySlugs:new Set(actual.map(row=>row.company_slug))}).length,0);
});
