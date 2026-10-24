import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parse,evaluate} from 'groq-js';
import {selectFeaturedHomepageArticles} from '../lib/homepage-config.ts';
import {DATA_CATEGORIES,dataCategoryId,dataCategoryHref} from '../lib/data-navigation.ts';
const require=createRequire(import.meta.url);
function compile(path,mocks){
  const source=fs.readFileSync(new URL(path,import.meta.url),'utf8');
  const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const loaded={exports:{}};new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),loaded,loaded.exports);return loaded.exports;
}
function loader(results){
  const calls=[];
  const api=compile('../lib/data-featured-stories.ts',{
    react:{cache:fn=>fn},'next-sanity':{defineQuery:q=>q},
    '@/lib/homepage-config':{selectFeaturedHomepageArticles},
    '@/sanity/lib/client':{client:{fetch:async(...args)=>{calls.push(args);const result=results.shift();if(result instanceof Error)throw result;return result;}}}
  });return {api,calls};
}
const article=id=>({_id:id,_updatedAt:'2026-10-24',title:`Featured ${id}`,slug:id,categorySlug:'news',mainImageUrl:`https://example.com/${id}.webp`,socialImageUrl:null});
test('uses the same five editorial picks, deduplicates and preserves homepage order',async()=>{
  const {api,calls}=loader([{featuredArticleId:'a',supportingFeaturedArticleIds:['b','b','c','d','e'],secondFeaturedArticleId:'f'},['f','e','d','c','b','a'].map(article)]);
  const selected=await api.getDataFeaturedStories();assert.equal(calls.length,2,JSON.stringify(calls));assert.deepEqual(selected.map(a=>a._id),['a','b','c','d','e']);
  assert.equal(calls.length,2);assert.equal(calls[1][1].ids.length,6);
  for(const call of calls){assert.equal(call[2].perspective,'published');assert.equal(call[2].stega,false);assert.equal(call[2].next.revalidate,60);}
});
test('no configured picks means no recent-upload fallback and no article read',async()=>{
  const {api,calls}=loader([null]);assert.deepEqual(await api.getDataFeaturedStories(),[]);assert.equal(calls.length,1);
});
test('missing selected articles are omitted and CMS failure is non-fatal',async()=>{
  const {api}=loader([{featuredArticleId:'missing',supportingFeaturedArticleIds:['b']},[article('b')]]);
  assert.deepEqual((await api.getDataFeaturedStories()).map(a=>a._id),['b']);
  assert.deepEqual(await loader([new Error('offline')]).api.getDataFeaturedStories(),[]);
});
test('query returns only eligible selected published documents and excludes draft/release records',async()=>{
  const {api}=loader([]);
  const dataset=[{_id:'category',_type:'category',slug:{current:'news'}},...['a','unselected','drafts.a','versions.release.a'].map(id=>({_type:'post',_id:id,title:id,slug:{current:'story'},category:{_ref:'category'}}))];
  const value=await evaluate(parse(api.DATA_FEATURED_ARTICLES_QUERY),{dataset,params:{ids:['a','drafts.a','versions.release.a']}});
  assert.deepEqual((await value.get()).map(a=>a._id),['a']);
});
test('compact section renders at most five links and disappears when empty',()=>{
  const component=compile('../components/DataFeaturedStories.tsx',{
    'next/image':{__esModule:true,default:({src,alt,sizes})=>React.createElement('img',{src,alt,sizes})},
    '@/components/NavigationLink':{__esModule:true,default:({href,children})=>React.createElement('a',{href},children)},
    '@/lib/article-card-data':{articleHref:a=>'/articles/'+a.slug,articleImageUrl:a=>a.mainImageUrl}
  }).default;
  assert.equal(renderToStaticMarkup(React.createElement(component,{articles:[]})),'');
  const html=renderToStaticMarkup(React.createElement(component,{articles:['a','b','c','d','e','f'].map(article)}));
  assert.equal((html.match(/<li /g)||[]).length,5);assert.ok(!html.includes('Featured f'));assert.ok(html.includes('Featured Stories'));
  const page=fs.readFileSync(new URL('../app/data/[slug]/page.tsx',import.meta.url),'utf8');
  assert.ok(page.indexOf('<DataFeaturedStories articles={featured}/>')>page.indexOf('id="related-datasets"'));
  assert.ok(page.includes("featured.length?'mt-7 grid items-start"));
  const componentSource=fs.readFileSync(new URL('../components/DataFeaturedStories.tsx',import.meta.url),'utf8');
  assert.ok(componentSource.includes('lg:col-start-2'));assert.ok(componentSource.includes('lg:row-start-1'));
});
test('homepage Data section shows approved datasets by category and links to stable hub anchors',()=>{
  const pages=DATA_CATEGORIES.flatMap((segment,i)=>[{slug:`data-${i}`,title:`Dataset ${i}`,segment,reviewRequired:false}]);
  pages.push({slug:'not-approved',title:'Hidden',segment:'Economy Data',reviewRequired:true});
  const component=compile('../components/HomepageDataSection.tsx',{
    'next/link':{__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)},
    '@/lib/data-library':{dataPages:pages},
    '@/lib/data-navigation':{DATA_CATEGORIES,dataCategoryHref}
  }).default;
  const html=renderToStaticMarkup(React.createElement(component));
  assert.equal((html.match(/<article /g)||[]).length,4);assert.ok(!html.includes('not-approved'));
  for(const name of DATA_CATEGORIES){assert.ok(html.includes(dataCategoryHref(name)));assert.ok(!dataCategoryId(name).includes(' '));}
  const home=fs.readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.ok(home.includes("section.categorySlug==='business-model'"));assert.ok(home.includes('index===dataAfterIndex&&<HomepageDataSection/>'));assert.ok(home.includes('dataAfterIndex<0&&<HomepageDataSection/>'));
  const footer=fs.readFileSync(new URL('../components/Footer.tsx',import.meta.url),'utf8');
  assert.ok(footer.includes('aria-label="Data navigation"'));assert.equal((footer.match(/href="\/data"/g)||[]).length,1);
  const shelf=fs.readFileSync(new URL('../components/DatasetShelf.tsx',import.meta.url),'utf8');assert.ok(shelf.includes('id={dataCategoryId(title)}'));
});
