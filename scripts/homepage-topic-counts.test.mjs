import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {parse,evaluate} from 'groq-js';

const require=createRequire(import.meta.url);
const cache=new Map();
function load(path){
  if(cache.has(path))return cache.get(path);
  const source=fs.readFileSync(new URL(`../${path}.ts`,import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const loaded={exports:{}};
  new Function('require','module','exports',compiled)(name=>name==='next-sanity'?{defineQuery:q=>q}:name.startsWith('@/')?load(name.slice(2)):require(name),loaded,loaded.exports);
  cache.set(path,loaded.exports);
  return loaded.exports;
}
const {homepageTopicCountQuery}=load('lib/homepage-topic-counts');
const {ARTICLE_DIRECTORY_FILTER}=load('lib/article-directory-filter');
const article=(id,values={})=>({_id:id,_type:'post',title:'Ordinary story',slug:{current:id},category:{_ref:'business'},...values});
const dataset=[
  {_id:'business',_type:'category',title:'Business Model',slug:{current:'business-model'}},
  {_id:'finance',_type:'industry',name:'Financial Services'},
  {_id:'old',_type:'company',name:'Legacy Co',industry:'Fintech',industryCategory:{_ref:'finance'}},
  {_id:'new',_type:'company',name:'Modern Co',industryCategory:{_ref:'fintech-sector'}},
  {_id:'fintech-sector',_type:'industry',name:'Fintech'},
  article('legacy',{company:[{_ref:'old'}]}),
  article('modern',{company:[{_ref:'new'}]}),
  article('headline',{title:'Fintech funding news'}),
  article('description',{seoDescription:'A fintech platform'}),
  article('unrelated'),
  article('drafts.hidden',{title:'Fintech draft'}),
  article('versions.release.hidden',{title:'Fintech release'}),
];
const run=async(query,params)=>(await evaluate(parse(query),{dataset,params})).get();

test('topic counts and directory results use identical matching, including both industry fields',async()=>{
  const request=homepageTopicCountQuery(['/articles?q=Fintech']);
  const counts=await run(request.query,request.params);
  assert.equal(counts.topic0,4);
  const params={q:'Fintech',search:'Fintech*',category:'',company:'',industry:''};
  const ids=await run(`*[${ARTICLE_DIRECTORY_FILTER}]._id`,params);
  assert.equal(counts.topic0,ids.length);
  assert.deepEqual(ids.sort(),['description','headline','legacy','modern']);
});

test('counts follow destination query filters and count all results, not a paginated slice',async()=>{
  const request=homepageTopicCountQuery(['/articles?q=Fintech&company=Legacy%20Co&page=2','/articles?category=business-model','/articles?q=missing']);
  const counts=await run(request.query,request.params);
  assert.deepEqual(counts,{topic0:1,topic1:5,topic2:0});
});

test('URL normalization matches directory rules and never interpolates user search text into GROQ',()=>{
  const request=homepageTopicCountQuery(['/articles?q=Fintech&q=ignored','/articles?q=All','/articles?q=%22%5D%20%7C%20order(title)','https://elsewhere.test/articles?q=Fintech','//elsewhere.test/articles','/topics/business-model']);
  assert.equal(request.params.q0,'Fintech');
  assert.equal(request.params.q1,'');
  assert.equal(request.params.q2,'"] | order(title)');
  assert.ok(!request.query.includes('order(title)'));
  assert.ok(!request.query.includes('topic3'));
  assert.equal(homepageTopicCountQuery(['/topics/business-model']).query,null);
});

test('both rendering paths import the shared filter; homepage no longer uses substring counts',()=>{
  const directory=fs.readFileSync(new URL('../lib/public-directories.ts',import.meta.url),'utf8');
  const topics=fs.readFileSync(new URL('../components/Topics.tsx',import.meta.url),'utf8');
  assert.ok(directory.includes('articles: ARTICLE_DIRECTORY_FILTER'));
  assert.ok(topics.includes('homepageTopicCountQuery'));
  assert.ok(!topics.includes('searchableArticleText'));
});
