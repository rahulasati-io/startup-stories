import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {PassThrough} from 'node:stream';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup,renderToPipeableStream} from 'react-dom/server';

const require=createRequire(import.meta.url);
const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');
function load(path,mocks){
  const compiled=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),module,module.exports);
  return module.exports.default;
}
const link={__esModule:true,default:({href,children,...props})=>React.createElement('a',{href,...props},children)};

test('header uses pending-aware links for desktop and mobile without intercepting routing',()=>{
  const source=read('components/Header.tsx');
  assert.match(source,/import Link from "@\/components\/NavigationLink"/);
  assert.equal((source.match(/feedback="navigation"/g)||[]).length,4);
  assert.match(source,/loadingLabel=\{item\.label\}/);
  assert.match(source,/const menuOpen = menuPath === pathname/);
  assert.doesNotMatch(source,/preventDefault|router\.push|setTimeout/);
});

test('all public route families have lightweight fallbacks; detailed profile fallbacks remain',()=>{
  for(const dir of ['', 'companies/', 'people/', 'articles/', 'authors/', 'data/', 'topics/', 'search/']){
    assert.match(read(`app/${dir}loading.tsx`),/PageLoading/);
  }
  assert.match(read('app/companies/[slug]/loading.tsx'),/ProfileLoading/);
  assert.match(read('app/people/[slug]/loading.tsx'),/ProfileLoading/);
  assert.match(read('app/articles/[slug]/loading.tsx'),/Loading article/);
  const PageLoading=load('components/PageLoading.tsx',{'@/components/Header':{__esModule:true,default:()=>React.createElement('header',null,'Navigation')}});
  const html=renderToStaticMarkup(React.createElement(PageLoading,{label:'data'}));
  assert.match(html,/aria-busy="true"/);
  assert.match(html,/role="status"[^>]*>Opening data…/);
  assert.match(html,/motion-reduce:animate-none/);
  assert.doesNotMatch(html,/<h1|noindex|fetch\(/);
});

function footerWith(fetch){return load('components/Footer.tsx',{
  'next/link':link,
  'next-sanity':{defineQuery:q=>q},
  '@/components/SiteLogo':{__esModule:true,default:()=>React.createElement('span',null,'MisterStory')},
  '@/sanity/lib/live':{sanityFetch:fetch},
  '@/lib/topic-visibility':{TOPIC_ARTICLE_FILTER:'_type == "post"'},
  '@/lib/data-navigation':{DATA_CATEGORIES:['Economy Data'],dataCategoryHref:()=>'/data#economy-data'},
});}

test('slow footer CMS fetch does not block main content or static footer links', {timeout:5000},async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  let calls=0;
  const Footer=footerWith(()=>{calls++;return gate;});
  let html='';
  const out=new PassThrough();
  out.on('data',chunk=>{html+=chunk;});
  const firstChunk=new Promise(resolve=>out.once('data',resolve));
  const ended=new Promise((resolve,reject)=>{out.on('end',resolve);out.on('error',reject);});
  let shellReady;
  const shell=new Promise(resolve=>{shellReady=resolve;});
  const stream=renderToPipeableStream(React.createElement('html',null,React.createElement('body',null,
    React.createElement('main',null,'Main page content'),React.createElement(Footer))),{
    onShellReady(){stream.pipe(out);shellReady();},onError(error){out.destroy(error);},
  });
  try{
    await shell;
    await firstChunk;
    assert.match(html,/Main page content/);
    assert.match(html,/href="\/data"/);
    assert.match(html,/href="\/privacy"/);
    assert.doesNotMatch(html,/Example Company/);
    release({data:{companies:[{_id:'example',name:'Example Company',slug:'example'}],topicSlugs:['strategy']}});
    await ended;
    assert.match(html,/href="\/companies\/example"/);
    assert.match(html,/href="\/topics\/strategy"/);
    assert.equal(calls,1);
  }finally{release({data:null});stream.abort();}
});

test('footer fetch failure retains navigation and contains no fabricated company links',{timeout:5000},async()=>{
  const Footer=footerWith(async()=>{throw Error('simulated CMS outage');});
  let html='';const out=new PassThrough();out.on('data',chunk=>{html+=chunk;});
  const ended=new Promise((resolve,reject)=>{out.on('end',resolve);out.on('error',reject);});
  const stream=renderToPipeableStream(React.createElement(Footer),{onShellReady(){stream.pipe(out);},onError(error){out.destroy(error);}});
  try{await ended;assert.match(html,/href="\/about"/);assert.match(html,/href="\/data"/);assert.doesNotMatch(html,/href="\/companies\/example"/);}finally{stream.abort();}
});
