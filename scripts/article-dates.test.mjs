import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {parse,evaluate} from 'groq-js';
import {articleDates} from '../lib/article-dates.ts';
import {formatIstDateTime} from '../lib/display-dates.mjs';
import {createSitemapResponse} from '../lib/sitemap-xml.ts';
const require=createRequire(import.meta.url);
const publishedAt='2026-10-15T20:30:00Z';
const contentUpdatedAt='2026-10-18T07:45:00Z';
const maintenance='2026-11-21T14:00:00Z';
const read=file=>fs.readFileSync(new URL('../'+file,import.meta.url),'utf8');

test('new articles use publication date consistently, ignoring technical revisions',()=>{
  const dates=articleDates({publishedAt,_updatedAt:maintenance});
  assert.deepEqual(dates,{publishedAt,modifiedAt:publishedAt,visibleDate:publishedAt,label:'Published'});
  assert.match(formatIstDateTime(dates.visibleDate),/16 Oct 2026/);
});
test('updated articles retain original publication and use editorial update everywhere',()=>{
  const dates=articleDates({publishedAt,contentUpdatedAt,_updatedAt:maintenance});
  assert.deepEqual(dates,{publishedAt,modifiedAt:contentUpdatedAt,visibleDate:contentUpdatedAt,label:'Updated'});
});
test('missing dates are not invented from technical updates or creation dates',()=>{
  const dates=articleDates({_updatedAt:maintenance,_createdAt:publishedAt});
  assert.equal(dates.publishedAt,undefined);assert.equal(dates.modifiedAt,undefined);assert.equal(dates.visibleDate,undefined);
  assert.equal(articleDates({publishedAt:null,contentUpdatedAt:''}).modifiedAt,undefined);
  assert.equal(articleDates({contentUpdatedAt}).modifiedAt,contentUpdatedAt);
});
test('visible byline, JSON-LD and sharing metadata consume the same helper without changing display timezone',()=>{
  const source=read('app/articles/[slug]/page.tsx');
  assert.equal((source.match(/const dates = articleDates\(article\)/g)||[]).length,2);
  for(const fragment of ['datePublished: dates.publishedAt','dateModified: dates.modifiedAt','publishedTime: dates.publishedAt','modifiedTime: dates.modifiedAt','dateTime={dates.visibleDate}','formatIstDateTime(dates.visibleDate)'])assert.ok(source.includes(fragment),fragment);
  assert.doesNotMatch(source,/dateModified:.*_updatedAt/);
});

function sitemapModule(documents){
  const source=read('lib/sitemap-data.ts');
  const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
  const mod={exports:{}};let query;let options;
  const mocks={
    'next-sanity':{defineQuery:q=>q},
    '@/lib/article-dates':{articleDates},
    '@/lib/site-url':{absoluteUrl:path=>'https://misterstory.in'+path},
    '@/lib/topic-visibility':{TOPIC_ARTICLE_FILTER:'_type == "post"'},
    '@/lib/data-library':{dataPages:[]},
    '@/sanity/lib/client':{client:{withConfig:config=>{assert.equal(config.useCdn,false);return {fetch:async(q,_params,opts)=>{query=q;options=opts;return documents;}};}}},
  };
  new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),mod,mod.exports);
  return {api:mod.exports,query:()=>query,options:()=>options};
}
test('article sitemap uses editorial dates while other document types retain their existing lastmod',async()=>{
  const {api,query,options}=sitemapModule([
    {_type:'post',slug:'new',publishedAt,lastModified:maintenance},
    {_type:'post',slug:'updated',publishedAt,contentUpdatedAt,lastModified:maintenance},
    {_type:'post',slug:'missing-dates',lastModified:maintenance},
    {_type:'company',slug:'example',lastModified:maintenance},
  ]);
  const entries=await api.getContentSitemap(['post','company']);
  assert.deepEqual(entries.map(e=>e.lastModified),[publishedAt,contentUpdatedAt,undefined,maintenance]);
  assert.equal(entries[2].url,'https://misterstory.in/articles/missing-dates');
  assert.equal(options().cache,'no-store');assert.equal(options().perspective,'published');
  const dataset=[{_id:'post-a',_type:'post',slug:{current:'a'},publishedAt,contentUpdatedAt,_updatedAt:maintenance}];
  const projected=await (await evaluate(parse(query()),{dataset,params:{types:['post']}})).get();
  assert.equal(projected[0].publishedAt,publishedAt);assert.equal(projected[0].contentUpdatedAt,contentUpdatedAt);
  assert.equal(articleDates(projected[0]).modifiedAt,contentUpdatedAt);
});
test('XML includes accurate editorial lastmod or omits it without removing the URL',async()=>{
  const entries=[{url:'https://misterstory.in/articles/new',lastModified:articleDates({publishedAt,_updatedAt:maintenance}).modifiedAt},
    {url:'https://misterstory.in/articles/undated',lastModified:articleDates({_updatedAt:maintenance}).modifiedAt}];
  const xml=await createSitemapResponse(entries).text();
  assert.match(xml,/<lastmod>2026-10-15T20:30:00.000Z<\/lastmod>/);
  assert.match(xml,/<loc>https:\/\/misterstory.in\/articles\/undated<\/loc>/);
  assert.equal((xml.match(/<lastmod>/g)||[]).length,1);
  assert.doesNotMatch(xml,/2026-11-21/);
});
