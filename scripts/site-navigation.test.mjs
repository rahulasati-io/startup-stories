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
  const loadedModule={exports:{}};
  new Function('require','module','exports',compiled)(name=>mocks[name]??require(name),loadedModule,loadedModule.exports);
  return loadedModule.exports.default;
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

test('public route families have no inherited loading shells; navigation feedback remains',()=>{
  for(const path of ['app/loading.tsx','app/articles/loading.tsx','app/articles/[slug]/loading.tsx',
    ...['companies','people','authors','data','topics','search','companies/[slug]','people/[slug]'].map(dir=>`app/${dir}/loading.tsx`)]) {
    assert.equal(fs.existsSync(new URL('../'+path,import.meta.url)),false);
  }
  const PageLoading=load('components/PageLoading.tsx',{'@/components/Header':{__esModule:true,default:()=>React.createElement('header',null,'Navigation')}});
  const html=renderToStaticMarkup(React.createElement(PageLoading,{label:'data'}));
  assert.match(html,/aria-busy="true"/);
  assert.match(html,/class="sr-only"[^>]*>Loading data…/);
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

test('footer navigation is resolved before the initial HTML shell is sent', {timeout:5000},async()=>{
  let release;
  const gate=new Promise(resolve=>{release=resolve;});
  let entered;
  const fetching=new Promise(resolve=>{entered=resolve;});
  let calls=0;
  const Footer=footerWith(()=>{calls++;entered();return gate;});
  let html='';
  const out=new PassThrough();
  out.on('data',chunk=>{html+=chunk;});
  const ended=new Promise((resolve,reject)=>{out.on('end',resolve);out.on('error',reject);});
  let shellReady=false;
  const stream=renderToPipeableStream(React.createElement('html',null,React.createElement('body',null,
    React.createElement('main',null,'Main page content'),React.createElement(Footer))),{
    onShellReady(){shellReady=true;stream.pipe(out);},onError(error){out.destroy(error);},
  });
  try{
    await fetching;
    assert.equal(shellReady,false);
    assert.equal(html,'');
    release({data:{companies:[{_id:'example',name:'Example Company',slug:'example'}],topicSlugs:['strategy']}});
    await ended;
    assert.match(html,/Main page content/);
    assert.match(html,/href="\/data"/);
    assert.match(html,/href="\/privacy"/);
    assert.doesNotMatch(html,/<div hidden/);
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
