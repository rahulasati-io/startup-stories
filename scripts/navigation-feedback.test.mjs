import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require=createRequire(import.meta.url);
let pending=false;
let forwarded;
let intentHref=null;
function MockLink(props){
  forwarded=props;
  return React.createElement('a',{href:typeof props.href==='string'?props.href:props.href.pathname,className:props.className,'data-navigation-link':props['data-navigation-link']},props.children);
}
const mock={__esModule:true,default:MockLink,useLinkStatus:()=>({pending})};
const source=fs.readFileSync(new URL('../components/NavigationLink.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const testModule={exports:{}};
const reactMock={...React,useState:()=>[intentHref,value=>{intentHref=value;}]};
new Function('require','module','exports',compiled)(name=>name==='next/link'?mock:name==='react'?reactMock:require(name),testModule,testModule.exports);
const NavigationLink=testModule.exports.default;
const render=(props,children)=>renderToStaticMarkup(React.createElement(NavigationLink,props,children));

test('idle links keep server-rendered content and crawlable href without a loading message',()=>{
  pending=false;
  const html=render({href:'/companies/safari'},React.createElement('h3',null,'Safari Industries'));
  assert.match(html,/href="\/companies\/safari"/);
  assert.match(html,/<h3>Safari Industries<\/h3>/);
  assert.doesNotMatch(html,/role="status"|Opening/);
});
test('pending cards announce their nested company, person or article heading',()=>{
  pending=true;
  for(const [href,name]of [['/companies/safari','Safari Industries'],['/people/rahul-asati','Rahul Asati'],['/articles/example','Example article']]){
    const html=render({href},React.createElement('div',null,React.createElement('h3',null,name)));
    assert.ok(html.includes(`Opening ${name}…`));
    assert.match(html,/role="status"/);
  }
});
test('hash navigation has no card overlay even if Next reports pending',()=>{
  pending=true;
  assert.doesNotMatch(render({href:'#same-industry'},'Similar Companies'),/role="status"|Opening/);
});

test('main navigation pending feedback is out of flow and retains its destination label',()=>{
  pending=true;
  const html=render({href:'/data',loadingLabel:'Data',feedback:'navigation'},'Data');
  assert.match(html,/navigation-bar-status/);
  assert.match(html,/Opening Data…/);
  assert.doesNotMatch(html,/navigation-link-status/);
  assert.equal(forwarded.feedback,undefined);
  pending=false;
  assert.doesNotMatch(render({href:'/data',feedback:'navigation'},'Data'),/navigation-bar-status|role="status"/);
});
test('prefetch opt-outs, new-tab modifiers and event props are not intercepted',()=>{
  pending=false;
  const onClick=()=>{};
  const onNavigate=()=>{};
  render({href:'/people/example',prefetch:false,target:'_blank',rel:'noopener',onClick,onNavigate,scroll:false},'Profile');
  assert.equal(forwarded.prefetch,false);
  assert.equal(forwarded.target,'_blank');
  assert.equal(forwarded.onClick,onClick);
  assert.equal(forwarded.onNavigate,onNavigate);
  assert.equal(forwarded.scroll,false);
});
test('explicit labels and fallback labels render safely',()=>{
  pending=true;
  assert.match(render({href:'/people/example'},'Profile'),/Opening person profile…/);
  assert.match(render({href:'/companies/example',loadingLabel:'A & B'},'Profile'),/Opening A &amp; B…/);
});
test('route scrolling uses the Next 16 opt-in and motion preferences are respected',()=>{
  const layout=fs.readFileSync(new URL('../app/layout.tsx',import.meta.url),'utf8');
  const css=fs.readFileSync(new URL('../app/globals.css',import.meta.url),'utf8');
  assert.match(layout,/data-scroll-behavior="smooth"/);
  assert.match(css,/@media \(prefers-reduced-motion: reduce\)/);
  assert.match(css,/\.navigation-spinner, \.page-arrival main:not\(\[aria-busy="true"\]\) \{ animation: none; \}/);
});

test('profile/article prefetch is off until hover, keyboard focus or touch intent',()=>{
  for(const href of ['/companies/safari','/people/example','/articles/example']){
    for(const handler of ['onMouseEnter','onFocus','onTouchStart']){
      intentHref=null;
      render({href,prefetch:false},'Profile');
      assert.equal(forwarded.prefetch,false);
      forwarded[handler]({defaultPrevented:false});
      render({href,prefetch:false},'Profile');
      assert.equal(forwarded.prefetch,true);
    }
  }
});
test('intent prefetch preserves explicit opt-outs, new tabs, downloads, hashes and other routes',()=>{
  for(const props of [{href:'/companies/safari',intentPrefetch:false,prefetch:false},{href:'/companies/safari',target:'_blank',prefetch:false},{href:'/companies/safari',download:'',prefetch:false},{href:'#overview',prefetch:false},{href:'/search?q=example',prefetch:false},{href:'https://example.com/companies/safari',prefetch:false},{href:'//example.com/companies/safari',prefetch:false}]){
    intentHref=null;
    render(props,'Link');
    forwarded.onMouseEnter({defaultPrevented:false});
    render(props,'Link');
    assert.equal(forwarded.prefetch,false);
  }
});
test('canceled handlers and data-saving/slow connections do not trigger extra prefetch',()=>{
  const original=Object.getOwnPropertyDescriptor(globalThis,'navigator');
  try{
    for(const connection of [{saveData:true},{effectiveType:'slow-2g'},{effectiveType:'2g'}]){
      Object.defineProperty(globalThis,'navigator',{configurable:true,value:{connection}});
      intentHref=null;
      render({href:'/companies/safari'},'Profile');
      forwarded.onMouseEnter({defaultPrevented:false});
      render({href:'/companies/safari'},'Profile');
      assert.equal(forwarded.prefetch,false);
    }
  }finally{if(original)Object.defineProperty(globalThis,'navigator',original);else delete globalThis.navigator;}
  intentHref=null;
  let called=false;
  render({href:'/companies/safari',onFocus:event=>{called=true;event.defaultPrevented=true;}},'Profile');
  forwarded.onFocus({defaultPrevented:false});
  assert.ok(called);
  render({href:'/companies/safari'},'Profile');
  assert.equal(forwarded.prefetch,false);
});
test('leaving a card and changing destination cannot activate another card accidentally',()=>{
  intentHref=null;
  render({href:'/companies/safari'},'Safari');
  forwarded.onMouseEnter({defaultPrevented:false});
  render({href:'/companies/boldfit'},'Boldfit');
  assert.equal(forwarded.prefetch,false);
  forwarded.onMouseLeave({});
  assert.equal(intentHref,null);
  render({href:'/companies/safari',prefetch:true},'Safari');
  assert.equal(forwarded.prefetch,true);
});
