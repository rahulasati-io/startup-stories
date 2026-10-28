import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {parse,evaluate} from 'groq-js';
import {selectSidebarStories} from '../lib/sidebar-stories.ts';

const require=createRequire(import.meta.url);
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
function compile(source,mocks){
  const output=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',output)(name=>mocks[name]??require(name),module,module.exports);
  return module.exports;
}
const story=id=>({_id:id,title:`Article ${id}`,slug:id,_updatedAt:'2026-10-28',category:'News',categorySlug:'news',socialImageUrl:null,mainImageUrl:`https://example.com/${id}.webp`});
const shared=compile(read('components/SidebarArticleLinks.tsx'),{
  '@/components/NavigationLink':{__esModule:true,default:({href,children,prefetch,...props})=>React.createElement('a',{href,...props,'data-prefetch':String(prefetch)},children)},
  '@/lib/article-card-data':{articleHref:a=>`/articles/${a.slug}`,articleImageUrl:a=>a.socialImageUrl||a.mainImageUrl||(a.categorySlug?`/api/article-thumbnail/${a.categorySlug}/${a.slug}`:null)},
  '@/lib/sidebar-image':compile(read('lib/sidebar-image.ts'),{}),
}).default;

test('compact lists retain every title/category/link, use lazy 88px images and avoid bulk prefetch',()=>{
  const html=renderToStaticMarkup(React.createElement(shared,{articles:Array.from({length:10},(_,i)=>story(String(i)))}));
  assert.equal((html.match(/<li /g)||[]).length,10);
  assert.equal((html.match(/loading="lazy"/g)||[]).length,10);
  assert.equal((html.match(/sizes="88px"/g)||[]).length,10);
  assert.equal((html.match(/data-prefetch="false"/g)||[]).length,10);
  assert.doesNotMatch(html,/fetchPriority="high"|rel="preload"/);
  for(let i=0;i<10;i++)assert.match(html,new RegExp(`href="/articles/${i}"`));
});

test('image precedence, generated fallback and missing image keep working',()=>{
  const html=renderToStaticMarkup(React.createElement(shared,{articles:[
    {...story('social'),socialImageUrl:'https://example.com/social-override.webp'},
    {...story('generated'),mainImageUrl:null},
    {...story('none'),categorySlug:'',mainImageUrl:null},
  ]}));
  assert.match(html,/social-override.webp/);
  assert.match(html,/api\/article-thumbnail\/news\/generated/);
  assert.match(html,/variant=sidebar&amp;width=88/);
  assert.equal((html.match(/<img /g)||[]).length,2);
  assert.match(html,/Article none/);
});

test('people sidebar prioritises person stories, caps at five and removes ID/slug duplicates',()=>{
  const selected=selectSidebarStories([story('a'),story('b'),story('a')],[story('b'),{...story('different-id'),slug:'A'},story('c'),story('d'),story('e'),story('f')]);
  assert.deepEqual(selected.map(a=>a._id),['a','b','c','d','e']);
  assert.deepEqual(selectSidebarStories([],[]),[]);
  assert.deepEqual(selectSidebarStories([{...story('drafts.a')},{...story('versions.x.a')},{...story('empty'),title:''}],[]),[]);
});

function personSidebar(featured){
  const source=read('app/people/[slug]/page.tsx')+'\nexport {PersonSidebarArticles};';
  let calls=0;
  const mocks={
    'next-sanity':{defineQuery:q=>q},'next/image':{__esModule:true,default:()=>null},
    'next/navigation':{notFound:()=>{throw Error('NOT_FOUND');}},
    '@portabletext/react':{PortableText:()=>null},
    '@/components/SidebarArticleLinks':{__esModule:true,default:shared},
    '@/lib/data-featured-stories':{getDataFeaturedStories:async()=>{calls++;return featured;}},
    '@/lib/sidebar-stories':{selectSidebarStories},
    '@/sanity/lib/client':{client:{fetch:async()=>[]}},
    '@/sanity/lib/seo':{},'@/lib/profile-cache':{},'@/lib/structured-data':{},'@/lib/site-url':{},'@/lib/display-dates.mjs':{},'@/lib/business-model-thumbnail':{},
  };
  for(const name of [...source.matchAll(/from "(@\/components\/[^"\n]+)"/g)].map(m=>m[1]))mocks[name]??={__esModule:true,default:()=>null};
  return {component:compile(source,mocks).PersonSidebarArticles,calls:()=>calls};
}
const related=id=>({_id:id,_updatedAt:'2026-10-28',title:`Article ${id}`,slug:id,category:{title:'News',slug:'news'},imageUrl:`https://example.com/${id}.webp`});

test('people sidebar fills only vacant slots with featured picks and skips that fetch when full',async()=>{
  const partial=personSidebar([story('a'),story('c'),story('d'),story('e'),story('f')]);
  const html=renderToStaticMarkup(await partial.component({articles:Promise.resolve([related('a'),related('b')])}));
  assert.equal(partial.calls(),1);assert.equal((html.match(/<li /g)||[]).length,5);
  assert.equal((html.match(/href="\/articles\/a"/g)||[]).length,1);
  const full=personSidebar([]);await full.component({articles:Promise.resolve(['a','b','c','d','e'].map(related))});assert.equal(full.calls(),0);
  assert.equal(await personSidebar([]).component({articles:Promise.resolve([])}),null);
});

test('article lists still use ten recent and ten popular items, with image fields in the existing query',async()=>{
  const source=read('app/articles/[slug]/page.tsx');
  const query=source.match(/const ARTICLE_PAGE_SUPPORT_QUERY = defineQuery\(\/\* groq \*\/ `([\s\S]*?)`\);/)[1];
  assert.doesNotThrow(()=>parse(query));
  const posts=Array.from({length:12},(_,i)=>({_id:`p${i}`,_type:'post',title:`Post ${i}`,slug:{current:`post-${i}`},category:{_ref:'category'},promotion:'popular',publishedAt:`2026-10-${String(i+1).padStart(2,'0')}`,_updatedAt:'2026-10-28',mainImage:{asset:{_ref:'image'}}}));
  const dataset=[...posts,{_id:'category',_type:'category',title:'News',slug:{current:'news'}},{_id:'image',_type:'sanity.imageAsset',url:'https://example.com/image.webp'}];
  const result=await(await evaluate(parse(query),{dataset,params:{articleId:'current',categoryId:'category',referenceIds:[],companyIds:[],personIds:[],conceptIds:[]}})).get();
  assert.equal(result.recentArticles.length,10);assert.equal(result.popularArticles.length,10);
  for(const item of [...result.recentArticles,...result.popularArticles]){assert.equal(item.mainImageUrl,'https://example.com/image.webp');assert.equal(item.categorySlug,'news');}
  const sidebar=read('components/ArticleSidebar.tsx');
  assert.match(sidebar,/Recent articles/);assert.match(sidebar,/Popular articles/);assert.match(sidebar,/<SidebarArticleLinks/);
});

test('people sidebar is inside the biography grid after companies, not awaited by the main profile',()=>{
  const source=read('app/people/[slug]/page.tsx');
  assert.match(source,/<Suspense fallback=\{null\}><PersonSidebarArticles articles=\{articles\}/);
  assert.ok(source.indexOf('<PersonSidebarArticles')>source.indexOf('id="associated-companies"'));
  assert.match(source,/lg:grid-cols-\[minmax\(0,2.35fr\)_minmax\(280px,.9fr\)\]/);
  assert.match(source,/const relatedArticles=\(await articles\).slice\(0,3\)/);
});
