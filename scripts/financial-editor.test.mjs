import test from 'node:test';
import assert from 'node:assert/strict';
import {financialSnapshot, financialGroupRecords, saveEditorFinancials, allowExcelFinancials, editorFinancialPlan} from '../lib/financial-editor.mjs';
import {financialGroupLocked} from '../lib/financial-protection.mjs';
import {parseCompanyFinancials, financialColumnHeaders} from './lib/company-financials.mjs';
import {prepareAnnualFinancials, saveAnnualFinancials} from './lib/import-annual-financials.mjs';
import {saveLegacyFinancialMetrics, legacyMetricProtected} from './lib/import-legacy-financials.mjs';

const company = {_id:'company', _rev:'c1', _type:'company', name:'Example', slug:{current:'example'}, seoTitle:'Keep company SEO'};
const form = {year:2025,basis:'consolidated',currency:'INR',unit:'crore',sourceUrl:'https://example.com/report',amounts:{revenue:'200',ebitda:'0',net_profit_loss:'-25'}};
const row = {company_slug:'example',fy25_currency:'INR',fy25_unit:'Crore',fy25_reporting_basis:'Consolidated',fy25_source_url:'https://example.com/report',fy25_revenue:100,fy25_ebitda:5};
const observations = () => parseCompanyFinancials([row],financialColumnHeaders(25));

function memoryClient(seed=[]) {
  const docs = new Map([company,...seed].map(doc=>[doc._id,structuredClone(doc)]));
  let rev=10, generated=0, commits=0;
  const getSnapshot = id => {
    const saved=docs.get(id);
    return {company:saved ? {...structuredClone(saved),slug:saved.slug.current} : null,
      controls:[...docs.values()].filter(doc=>doc._type==='companyFinancialControl'&&doc.company._ref===id),
      metrics:[...docs.values()].filter(doc=>doc._type==='companyMetric'&&doc.company._ref===id).map(doc=>({...structuredClone(doc),companySlug:saved.slug.current}))};
  };
  return {
    docs, get commits(){return commits;}, beforeCommit:null,
    async fetch(_query,params){
      if(params.id) return getSnapshot(params.id);
      if(params.slugs) return [...docs.values()].filter(doc=>doc._type==='company'&&params.slugs.includes(doc.slug.current)).map(doc=>({...doc,slug:doc.slug.current,controls:getSnapshot(doc._id).controls}));
      if(params.ids) return params.ids.flatMap(id=>getSnapshot(id).metrics);
      throw new Error('Unexpected mock query');
    },
    snapshot(){return financialSnapshot(getSnapshot('company'));},
    transaction(){
      const operations=[];
      const runBeforeCommit=()=>{if(this.beforeCommit){const action=this.beforeCommit;this.beforeCommit=null;action();}};
      return {
        patch(id,callback){let revision, data;const patch={ifRevisionId(value){revision=value;return this;},set(value){data=value;return this;}};callback(patch);operations.push({id,revision,data});return this;},
        create(doc){operations.push({create:structuredClone(doc)});return this;},
        async commit(){
          runBeforeCommit();
          for(const op of operations) if(!op.create) assert.equal(docs.get(op.id)?._rev,op.revision,'Revision conflict; reload');
          const next=new Map(docs);
          for(const op of operations) {
            if(op.create){const id=op.create._id||`generated-${++generated}`;assert(!next.has(id));next.set(id,{...op.create,_id:id,_rev:`r${++rev}`});}
            else next.set(op.id,{...next.get(op.id),...op.data,_rev:`r${++rev}`});
          }
          docs.clear();for(const [id,doc] of next)docs.set(id,doc);
          commits++;
        },
      };
    },
  };
}

test('portal saves valid zero/loss, generated IDs and a whole-year lock atomically', async()=>{
  const client=memoryClient();
  await saveEditorFinancials(client,client.snapshot(),form);
  const saved=client.snapshot();
  assert.equal(client.commits,1);
  assert.equal(saved.metrics.length,3);
  assert.equal(saved.metrics.find(m=>m.metricCode==='ebitda').numericValue,0);
  assert.equal(saved.metrics.find(m=>m.metricCode==='net_profit_loss').numericValue,-25);
  assert(saved.metrics.every(m=>m.financialEditedInStudio&&m.financialEditedAt));
  assert(financialGroupLocked(saved.company,2025,'consolidated'));
  assert(!financialGroupLocked(saved.company,2025,'standalone'));
  assert.equal(client.docs.get('company').seoTitle,'Keep company SEO');
});

test('Excel dry run and write both preserve protected portal figures and skip new missing metrics', async()=>{
  const client=memoryClient();
  await saveEditorFinancials(client,client.snapshot(),{...form,amounts:{revenue:'200',ebitda:'',net_profit_loss:''}});
  const plan=await prepareAnnualFinancials(client,observations());
  assert(plan.every(op=>op.protected));
  await saveAnnualFinancials(client,plan,{dryRun:true,companyIds:new Map([['example','company']])});
  await saveAnnualFinancials(client,plan,{companyIds:new Map([['example','company']])});
  assert.equal(client.snapshot().metrics.length,1);
  assert.equal(client.snapshot().metrics[0].numericValue,200);
  assert.equal(client.commits,1);
});

test('lock acquired after Excel preflight is checked again at write time', async()=>{
  const client=memoryClient();
  const oldPlan=await prepareAnnualFinancials(client,observations());
  await saveEditorFinancials(client,client.snapshot(),form);
  await saveAnnualFinancials(client,oldPlan,{companyIds:new Map([['example','company']])});
  assert.equal(client.snapshot().metrics.find(m=>m.metricCode==='revenue').numericValue,200);
  assert.equal(client.commits,1);
});

test('explicit permission changes no figures, permits later Excel writes and next portal save re-locks', async()=>{
  const client=memoryClient();
  await saveEditorFinancials(client,client.snapshot(),form);
  const original=structuredClone(client.snapshot().metrics);
  await allowExcelFinancials(client,client.snapshot(),2025,'consolidated');
  assert.deepEqual(client.snapshot().metrics,original);
  assert(!financialGroupLocked(client.snapshot().company,2025,'consolidated'));
  const plan=await prepareAnnualFinancials(client,observations());
  await saveAnnualFinancials(client,plan,{companyIds:new Map([['example','company']])});
  assert.equal(client.snapshot().metrics.find(m=>m.metricCode==='revenue').numericValue,100);
  await saveEditorFinancials(client,client.snapshot(),form);
  assert(financialGroupLocked(client.snapshot().company,2025,'consolidated'));
});

test('older company-profile publishing cannot erase separately stored financial protection', async()=>{
  const client=memoryClient();
  await saveEditorFinancials(client,client.snapshot(),form);
  client.docs.set('company',{...company,_rev:'new-profile-revision'});
  const plan=await prepareAnnualFinancials(client,observations());
  assert(plan.every(op=>op.protected));
});

test('stale editor and concurrent import transactions abort atomically', async()=>{
  const client=memoryClient();
  const stale=client.snapshot();
  await saveEditorFinancials(client,stale,form);
  await assert.rejects(()=>saveEditorFinancials(client,stale,{...form,amounts:{...form.amounts,revenue:'999'}}),/Revision conflict/);
  assert.equal(client.snapshot().metrics.find(m=>m.metricCode==='revenue').numericValue,200);
  await allowExcelFinancials(client,client.snapshot(),2025,'consolidated');
  const plan=await prepareAnnualFinancials(client,observations());
  client.beforeCommit=()=>{client.docs.set('company',{...client.docs.get('company'),_rev:'concurrent'});};
  await assert.rejects(()=>saveAnnualFinancials(client,plan,{companyIds:new Map([['example','company']])}),/Revision conflict/);
  assert.equal(client.snapshot().metrics.find(m=>m.metricCode==='revenue').numericValue,200);
});

test('legacy IDs cannot bypass lock; unrelated outlet counts still import', async()=>{
  const client=memoryClient();
  await saveEditorFinancials(client,client.snapshot(),form);
  const docs=[{_id:'legacy-revenue',_type:'companyMetric',company:{_type:'reference',_ref:'company'},label:'Revenue',value:'999',period:'FY25'}, {_id:'outlets',_type:'companyMetric',company:{_type:'reference',_ref:'company'},label:'Stores',value:'150',period:'FY25'}];
  const result=await saveLegacyFinancialMetrics(client,docs);
  assert.equal(result.changed,1);
  assert.equal(result.skipped,1);
  assert(!client.docs.has('legacy-revenue'));
  assert.equal(client.docs.get('outlets').value,'150');
  assert(legacyMetricProtected(client.snapshot().company,{label:'Stores',period:'FY27'},client.snapshot().metrics.find(m=>m.metricCode==='revenue')));
});

test('invalid source, duplicate controls and existing metric drafts block safe saves', async()=>{
  const client=memoryClient();
  assert.throws(()=>editorFinancialPlan(client.snapshot(),{...form,sourceUrl:''}),/source URL/);
  assert.equal(client.commits,0);
  const controls=[{_id:'a',_rev:'a',lockedGroups:[]},{_id:'b',_rev:'b',lockedGroups:[]}];
  assert.throws(()=>financialSnapshot({company:{...company,slug:'example'},controls,metrics:[]}),/duplicates/);
  assert.throws(()=>financialGroupRecords([{_id:'drafts.m',label:'Revenue',period:'FY2025 (Consolidated)'}],2025,'consolidated'),/unpublished/);
});
