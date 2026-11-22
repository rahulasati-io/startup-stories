import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';

const require=createRequire(import.meta.url);
const source=fs.readFileSync(new URL('../sanity/components/PasteAwareArticleBodyInput.tsx',import.meta.url),'utf8');
const container=({children})=>React.createElement('div',null,children);
const mocks={
  '@sanity/icons/Expand':{ExpandIcon:()=>null},
  '@sanity/ui':{Box:container,Card:container,Flex:container,Stack:container,Text:container,Button:({text,onClick,disabled})=>React.createElement('button',{onClick,disabled},text)},
  sanity:{PortableTextInput:()=>{throw Error('Do not bypass the native input middleware');}},
};
const compiled={exports:{}};
new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText)(id=>mocks[id]??require(id),compiled,compiled.exports);
const BodyInput=compiled.exports.default;

test('body wrapper delegates native input props and preserves editor state across document updates',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  let root,latest,mounts=0,unmounts=0;
  function NativeInput(){
    React.useEffect(()=>{mounts++;return()=>unmounts++;},[]);
    return React.createElement('input',{'aria-label':'Alternative Text',defaultValue:'Initial'});
  }
  const renderDefault=props=>{latest=props;return React.createElement(NativeInput);};
  const onChange=()=>{},onPathFocus=()=>{},renderInput=()=>{},notify=()=>{};
  try{
    root=createRoot(document.getElementById('root'));
    const props={renderDefault,onChange,onPathFocus,renderInput,onFullScreenChange:notify,path:['body'],value:[]};
    await act(async()=>root.render(React.createElement(BodyInput,props)));
    assert.equal(latest.onChange,onChange);assert.equal(latest.renderInput,renderInput);assert.equal(latest.onPathFocus,onPathFocus);
    assert.equal(latest.initialFullscreen,false);
    const paste=latest.onPaste,fullscreen=latest.onFullScreenChange,input=document.querySelector('input');
    input.attachEvent=()=>{};input.detachEvent=()=>{};input.focus();input.value='Full alt text';
    await act(async()=>root.render(React.createElement(BodyInput,{...props,value:[{_type:'image',_key:'one',alt:'Full alt text'}]})));
    assert.equal(latest.onPaste,paste);assert.equal(latest.onFullScreenChange,fullscreen);
    assert.equal(document.querySelector('input'),input);assert.equal(document.activeElement,input);assert.equal(input.value,'Full alt text');
    assert.equal(mounts,1);assert.equal(unmounts,0);
    const event={clipboardData:{getData:()=>''},preventDefault:()=>{throw Error('Ordinary paste must remain native');}};
    assert.equal(paste({event,path:['body']}),undefined);
  }finally{if(root)await act(async()=>root.unmount());Object.assign(globalThis,previous);dom.window.close();}
});
