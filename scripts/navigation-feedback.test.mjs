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
function MockLink(props){
  forwarded=props;
  return React.createElement('a',{href:typeof props.href==='string'?props.href:props.href.pathname,className:props.className,'data-navigation-link':props['data-navigation-link']},props.children);
}
const mock={__esModule:true,default:MockLink,useLinkStatus:()=>({pending})};
const source=fs.readFileSync(new URL('../components/NavigationLink.tsx',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const testModule={exports:{}};
new Function('require','module','exports',compiled)(name=>name==='next/link'?mock:require(name),testModule,testModule.exports);
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
