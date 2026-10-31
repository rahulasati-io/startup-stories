import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {parse, evaluate} from 'groq-js';
import * as authors from '../lib/article-author.mjs';

const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
const require = createRequire(import.meta.url);
const dataset = [
  {_id:'rahul',_type:'author',name:'Rahul Asati',slug:{current:'rahul-asati'}},
  {_id:'legacy',_type:'author',name:'Old Rahul',slug:{current:'rahul'}},
  {_id:'drafts.rahul',_type:'author',name:'Unpublished name',slug:{current:'rahul-asati'}},
  {_id:'versions.release.rahul',_type:'author',name:'Future name',slug:{current:'rahul-asati'}},
  {_id:'other',_type:'author',name:'Other Writer',slug:{current:'other-writer'}},
];
const run = async (query, documents=dataset, params={}) => (await evaluate(parse(query),{dataset:documents,params})).get();
function queryFrom(path, name) {
  const source=read(path)+`\nexport {${name}};`;
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const compiled={exports:{}};
  new Function('require','module','exports',code)(id => {
    if(id==='next-sanity')return {defineQuery:q=>q};
    if(id==='sanity')return {ALL_FIELDS_GROUP:{},defineType:x=>x,defineField:x=>x,defineArrayMember:x=>x};
    if(id.endsWith('article-author.mjs'))return authors;
    if(id.startsWith('@/')||id.startsWith('../'))return {__esModule:true,default:()=>null};
    return require(id);
  },compiled,compiled.exports);
  return compiled.exports[name];
}

test('default is the canonical published Rahul, never the draft or release author',async()=>{
  assert.equal((await run(authors.DEFAULT_ARTICLE_AUTHOR_QUERY))._id,'rahul');
  const published=await run(authors.PUBLISHED_AUTHORS_QUERY);
  assert.deepEqual(published.map(a=>a._id),['rahul','legacy','other']);
  assert.equal(await run(authors.DEFAULT_ARTICLE_AUTHOR_QUERY,dataset.filter(d=>d._id!=='rahul'&&d._id!=='legacy')),null);
});

test('effective author preserves explicit selections and falls back for missing or unresolved references',async()=>{
  const posts=[
    {_id:'missing',_type:'post'},
    {_id:'broken',_type:'post',author:{_ref:'missing-author'}},
    {_id:'explicit',_type:'post',author:{_ref:'other'}},
    {_id:'rahul-post',_type:'post',author:{_ref:'rahul'}},
  ];
  const results=await run(`*[_type=="post"]{_id,"author":${authors.ARTICLE_AUTHOR_PROJECTION}}`,[...dataset,...posts]);
  assert.deepEqual(results.map(r=>r.author.name),['Rahul Asati','Rahul Asati','Other Writer','Rahul Asati']);
  assert.equal(results[0].author.slug,'rahul-asati');
});

test('import defaults cannot overwrite an existing writer; explicit selections and legacy slug work',()=>{
  const published=[{_id:'rahul',slug:'rahul-asati'},{_id:'other',slug:'other-writer'},{_id:'drafts.rahul',slug:'rahul-asati'}];
  const pick=(slug,ref)=>authors.importedArticleAuthorId(slug,ref?{_ref:ref}:undefined,published);
  assert.equal(pick(''),'rahul');
  assert.equal(pick('','other'),'other');
  assert.equal(pick('','drafts.rahul'),'rahul');
  assert.equal(pick('other-writer','rahul'),'other');
  assert.equal(pick('rahul','other'),'rahul');
  assert.equal(pick('invalid','other'),undefined);
  assert.equal(authors.importedArticleAuthorId('',null,[{_id:'drafts.rahul',slug:'rahul-asati'}]),undefined);
});

test('actual article and RSS queries resolve the same author',async()=>{
  const articleQuery=queryFrom('app/articles/[slug]/page.tsx','ARTICLE_QUERY');
  const feedQuery=queryFrom('app/feed.xml/route.ts','FEED_QUERY');
  const docs=[...dataset.filter(d=>!d._id.startsWith('drafts.')&&!d._id.startsWith('versions.')),
    {_id:'post',_type:'post',title:'Example',slug:{current:'example'},publishedAt:'2026-10-20',category:{_ref:'category'}},
    {_id:'category',_type:'category',title:'News',slug:{current:'news'}}];
  const article=await run(articleQuery,docs,{slug:'example'});
  const feed=await run(feedQuery,docs);
  assert.equal(article.author.name,'Rahul Asati');
  assert.equal(feed[0].author,article.author.name);
  const source=read('app/articles/[slug]/page.tsx');
  assert.match(source,/authors: article\.author\?\.name \? \[\{name: article\.author\.name/);
  assert.match(source,/authors: article\.author\?\.name/);
  assert.match(source,/name: article\.author\.name/);
  assert.match(source,/By[^\n]+article\.author\.name/);
});

test('author profile and directory counts include fallback articles only for Rahul',async()=>{
  const profile=queryFrom('app/authors/[slug]/page.tsx','AUTHOR_QUERY');
  const directory=queryFrom('app/authors/page.tsx','AUTHORS_QUERY');
  const docs=[...dataset.filter(d=>!d._id.startsWith('drafts.')&&!d._id.startsWith('versions.')),
    {_id:'category',_type:'category',slug:{current:'news'}},
    {_id:'fallback',_type:'post',slug:{current:'fallback'},category:{_ref:'category'}},
    {_id:'explicit-other',_type:'post',slug:{current:'other'},category:{_ref:'category'},author:{_ref:'other'}}];
  assert.deepEqual((await run(profile,docs,{slug:'rahul-asati'})).articles.map(a=>a._id),['fallback']);
  assert.deepEqual((await run(profile,docs,{slug:'other-writer'})).articles.map(a=>a._id),['explicit-other']);
  const counts=await run(directory,docs);
  assert.equal(counts.find(a=>a._id==='rahul').articleCount,1);
  assert.equal(counts.find(a=>a._id==='other').articleCount,1);
});

test('Studio defaults use the published canonical profile and keep the author field editable',async()=>{
  const schema=queryFrom('sanity/schemaTypes/postType.ts','postType');
  const defaults=await schema.initialValue({}, {getClient:()=>({fetch:async(query,params,options)=>{
    assert.equal(options.perspective,'published');return run(query);
  }})});
  assert.deepEqual(defaults.author,{_type:'reference',_ref:'rahul'});
  const field=schema.fields.find(f=>f.name==='author');
  assert.equal(field.readOnly,undefined);
});
