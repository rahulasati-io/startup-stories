import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('../components/FeaturedStories.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const loaded={exports:{}};
new Function('require','module','exports',compiled)(name=>{
  if(name==='next/image')return {__esModule:true,default:({src,alt,preload,sizes})=>React.createElement('img',{src,alt,sizes,'data-preload':String(Boolean(preload))})};
  if(name==='@/components/NavigationLink')return {__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)};
  if(name==='@/lib/article-card-data')return {articleHref:article=>'/articles/'+article.slug,articleImageUrl:article=>article.mainImageUrl};
  if(name==='@/lib/display-dates.mjs')return {formatIstDate:()=> '23 Oct 2026'};
  return require(name);
},loaded,loaded.exports);
const FeaturedStories=loaded.exports.default;
const items=Array.from({length:7},(_,i)=>({_id:String(i),title:`Story ${i}`,slug:`story-${i}`,category:'Company story',description:'Article description',mainImageUrl:`/story-${i}.png`,publishedAt:'2026-10-23T06:00:00Z',contentUpdatedAt:i===1?'2026-10-23T07:00:00Z':null}));
const render=articles=>renderToStaticMarkup(React.createElement(FeaturedStories,{articles}));

test('featured HTML includes one lead, four side stories and five crawlable article links',()=>{
  const html=render(items);
  assert.equal((html.match(/data-featured-lead="true"/g)||[]).length,1);
  assert.equal((html.match(/data-featured-supporting="true"/g)||[]).length,4);
  for(let i=0;i<5;i++)assert.ok(html.includes(`href="/articles/story-${i}"`));
  assert.ok(!html.includes('href="/articles/story-5"'));
  assert.ok(html.includes('112px'));
  assert.ok(html.includes('md:grid-cols-'));
  assert.ok(!html.includes('<h1'));
});

test('only the lead image is preloaded; date labels reflect publication versus update',()=>{
  const html=render(items);
  assert.equal((html.match(/data-preload="true"/g)||[]).length,1);
  assert.equal((html.match(/data-preload="false"/g)||[]).length,4);
  assert.ok(html.includes('Published 23 Oct 2026'));
  assert.ok(html.includes('Updated 23 Oct 2026'));
  assert.ok(html.includes('dateTime="2026-10-23T07:00:00Z"'));
});

test('empty, single, fewer-than-five and missing-image collections render without filler cards',()=>{
  assert.equal(render([]),'');
  const single=render(items.slice(0,1));
  assert.ok(!single.includes('More featured stories'));
  const three=render(items.slice(0,3).map(item=>({...item,mainImageUrl:null})));
  assert.equal((three.match(/data-featured-supporting="true"/g)||[]).length,2);
  assert.ok(!three.includes('<img'));
});

test('homepage removes hero/duplicate search, keeps one accessible H1 and retains SEO metadata',()=>{
  const page=fs.readFileSync(new URL('../app/page.tsx',import.meta.url),'utf8');
  assert.ok(!page.includes('<Hero'));
  assert.ok(!page.includes('HomepageCompanySearch'));
  assert.equal((page.match(/<h1\b/g)||[]).length,1);
  assert.ok(page.includes('<h1 className="sr-only">'));
  assert.ok(page.includes('settings?.homepageHeading'));
  assert.ok(page.includes('alternates: {canonical: absoluteUrl("/")}'));
  assert.ok(page.includes('openGraph:'));
  assert.ok(page.includes('kind===\'featured\''));
  assert.ok(!page.includes('homepage-about-title'));
  assert.ok(!page.includes('About MisterStory'));
  assert.ok(page.includes('<Footer />'));
});

test('desktop side rows follow the lead height without headline-driven column growth',()=>{
  const html=render(items.map(item=>({...item,title:'A lengthy headline '.repeat(20)})));
  assert.ok(html.includes('items-stretch'));
  assert.ok(html.includes('md:absolute md:inset-0 md:grid'));
  assert.ok(html.includes('grid-template-rows:repeat(4, minmax(0, 1fr))'));
  assert.ok(render(items.slice(0,3)).includes('grid-template-rows:repeat(2, minmax(0, 1fr))'));
  assert.equal((html.match(/md:line-clamp-2/g)||[]).length,4);
  assert.ok(html.includes('A lengthy headline '.repeat(20)));
});
