import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {parse, evaluate} from 'groq-js';
import React from 'react';

const require=createRequire(import.meta.url);
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const company=read('app/companies/[slug]/page.tsx');
const person=read('app/people/[slug]/page.tsx');
const options={perspective:'published',stega:false,cache:'force-cache',next:{revalidate:60,tags:['published-profiles']}};
function queries(source){
  const ast=ts.createSourceFile('page.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
  const found={};
  for(const statement of ast.statements){
    if(!ts.isVariableStatement(statement))continue;
    for(const declaration of statement.declarationList.declarations){
      let value=declaration.initializer;
      if(value&&ts.isCallExpression(value))value=value.arguments[0];
      if(value&&ts.isNoSubstitutionTemplateLiteral(value))found[declaration.name.getText(ast)]=value.text;
    }
  }
  return found;
}
function load(source,mocks){
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const loaded={exports:{}};
  new Function('require','module','exports',compiled)(name=>{
    if(name in mocks)return mocks[name];
    if(name==='react'||name==='react/jsx-runtime')return require(name);
    if(name==='next-sanity')return {defineQuery:query=>query};
    if(name==='@/lib/profile-cache')return {PROFILE_FETCH_OPTIONS:options,PROFILE_CACHE_TAG:'published-profiles'};
    if(name==='@/sanity/lib/seo')return {SEO_SETTINGS_QUERY:'seo',DEFAULT_SEO_TEMPLATES:{},fillSeoTemplate:()=>''};
    if(name.startsWith('@/components/')||name==='next/image')return {__esModule:true,default:()=>null};
    if(name==='@portabletext/react')return {PortableText:()=>null};
    if(name==='@/sanity/lib/image')return {urlFor:()=>null};
    if(name==='@/lib/site-url')return {absoluteUrl:path=>'https://misterstory.in'+path};
    if(name==='@/lib/structured-data')return {breadcrumbJsonLd:()=>({}),portableTextToPlainText:()=>''};
    if(name==='next/navigation')return {notFound:()=>{throw Error('NOT_FOUND');}};
    if(name.startsWith('@/lib/'))return {};
    return require(name);
  },loaded,loaded.exports);
  return loaded.exports;
}

test('all profile GROQ queries parse, with no reference dereferencing in metric/funding/timeline filters',()=>{
  const all={...queries(company),...queries(person)};
  for(const query of Object.values(all))assert.doesNotThrow(()=>parse(query));
  for(const name of ['fundingQuery','timelineQuery','metricQuery']){
    assert.match(all[name],/company\._ref == \$companyId/);
    assert.doesNotMatch(all[name],/company->/);
  }
  assert.doesNotMatch(all.PERSON_QUERY,/relatedArticles|_type == "post"/);
});

test('direct-reference filters retain matching records and reject unrelated records',async()=>{
  const q=queries(company);
  for(const [query,type] of [['fundingQuery','fundingRound'],['timelineQuery','timelineEvent'],['metricQuery','companyMetric']]){
    const dataset=[{_id:'match',_type:type,company:{_ref:'company-a'}},{_id:'other',_type:type,company:{_ref:'company-b'}}];
    const result=await (await evaluate(parse(q[query]),{dataset,params:{companyId:'company-a'}})).get();
    assert.deepEqual(result.map(row=>row._id),['match']);
  }
});

test('company page returns overview and Suspense boundaries while secondary queries remain pending',async()=>{
  const calls=[];
  const page=load(company,{'@/sanity/lib/client':{client:{fetch:(query,params,opts)=>{
    calls.push({query,params,opts});
    if(query===queries(company).companyQuery)return Promise.resolve({_id:'a',name:'Test company',body:[]});
    if(query===queries(company).peopleQuery)return Promise.resolve([]);
    return new Promise(()=>{});
  }}}});
  const result=await Promise.race([page.default({params:Promise.resolve({slug:'test-company'})}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Overview blocked by secondary queries')),1000))]);
  const types=[];const text=[];
  function walk(value){if(Array.isArray(value))return value.forEach(walk);if(React.isValidElement(value)){types.push(value.type);walk(value.props.children);}else if(typeof value==='string')text.push(value);}
  walk(result);
  assert.ok(text.includes('Test company'));
  assert.ok(text.includes('Company overview'));
  assert.ok(types.filter(type=>type===React.Suspense).length>=2);
  assert.ok(calls.length>=7,'secondary requests begin eagerly and in parallel');
  assert.ok(calls.every(call=>call.opts===options));
});

test('missing companies remain a not-found response, never a blank successful profile',async()=>{
  const page=load(company,{'@/sanity/lib/client':{client:{fetch:query=>Promise.resolve(query===queries(company).companyQuery?null:[])}}});
  await assert.rejects(page.default({params:Promise.resolve({slug:'missing'})}),/NOT_FOUND/);
});

test('person biography does not wait for related-article queries',async()=>{
  const page=load(person,{'@/sanity/lib/client':{client:{fetch:query=>{
    if(query===queries(person).PERSON_QUERY)return Promise.resolve({_id:'p',name:'Test person',bio:[],companyRoles:[]});
    return new Promise(()=>{});
  }}}});
  const result=await Promise.race([page.default({params:Promise.resolve({slug:'test-person'})}),new Promise((_,reject)=>setTimeout(()=>reject(Error('Biography blocked by articles')),1000))]);
  const text=[];
  function walk(value){if(Array.isArray(value))return value.forEach(walk);if(React.isValidElement(value))walk(value.props.children);else if(typeof value==='string')text.push(value);}
  walk(result);
  assert.ok(text.includes('Test person'));
  assert.ok(text.includes('Biography'));
});

test('profile cache remains published-only with short fallback and request-level memoization',()=>{
  const cache=read('lib/profile-cache.ts');
  assert.match(cache,/perspective: "published"/);
  assert.match(cache,/revalidate: 60/);
  assert.match(cache,/cache: "force-cache"/);
  assert.match(company,/getCompany = cache\(/);
  assert.match(person,/getPerson = cache\(/);
  assert.match(person,/getPersonArticles = cache\(/);
  assert.match(person,/<Suspense fallback=\{<ProfileSectionsLoading\/>\}><PeopleRow/);
});

test('only a valid signed webhook expires profile cache and invalidates pages',async()=>{
  const source=read('app/api/revalidate/route.ts');
  const previous=process.env.SANITY_REVALIDATE_SECRET;
  process.env.SANITY_REVALIDATE_SECRET='test-only';
  try{
    for(const valid of [false,true]){
      const calls=[];
      const route=load(source,{
        'next/cache':{revalidateTag:(...args)=>calls.push(['tag',...args]),revalidatePath:(...args)=>calls.push(['path',...args])},
        'next/server':{NextResponse:{json:(body,init)=>({body,status:init?.status||200})}},
        'next-sanity/webhook':{parseBody:async(_request,_secret,wait)=>{assert.equal(wait,true);return {isValidSignature:valid,body:{_type:'company'}};}},
      });
      const response=await route.POST({headers:new Headers({'sanity-webhook-signature':'test-only'})});
      assert.equal(response.status,valid?200:401);
      assert.deepEqual(calls,valid?[['tag','published-profiles',{expire:0}],['path','/','layout']]:[]);
    }
  }finally{if(previous===undefined)delete process.env.SANITY_REVALIDATE_SECRET;else process.env.SANITY_REVALIDATE_SECRET=previous;}
});
