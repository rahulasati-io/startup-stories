import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {JSDOM} from 'jsdom';
const require=createRequire(import.meta.url);
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
function load(path,mocks={}) {
  const loaded={exports:{}};
  const output=ts.transpileModule(read(path),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX}}).outputText;
  new Function('require','module','exports',output)(name=>mocks[name]??require(name),loaded,loaded.exports);
  return loaded.exports;
}

test('native publish wrapper only changes the label for an existing published document',()=>{
  const {withUpdateLiveLabel}=load('sanity/actions/withUpdateLiveLabel.ts');
  let clicks=0;
  const descriptor={label:'Publish',disabled:true,title:'Native tooltip',icon:'native-icon',onHandle:()=>clicks++};
  const native=()=>descriptor;native.action='publish';
  const wrapped=withUpdateLiveLabel(native);
  assert.equal(wrapped,withUpdateLiveLabel(native),'stable identity');
  assert.equal(wrapped.action,'publish');
  assert.equal(wrapped({published:null}),descriptor,'new documents unchanged');
  const result=wrapped({published:{_id:'existing'}});
  assert.deepEqual(result,{...descriptor,label:'Update live'});
  assert.equal(result.onHandle,descriptor.onHandle);
  assert.equal(clicks,0,'rendering never publishes');
  result.onHandle();assert.equal(clicks,1);
  assert.equal(withUpdateLiveLabel(()=>null)({published:{}}),null);
});

test('article publish label varies but original date patch and validation remain',()=>{
  const source=read('sanity/actions/ArticlePublishAction.tsx');
  assert.match(source,/props\.published \? "Update live" : "Publish"/);
  assert.match(source,/contentUpdatedAt: now/);
  assert.match(source,/publishedAt: now/);
  assert.match(source,/patch\.execute\(\[\{ set: datePatch \}\]\)/);
  assert.match(source,/publish\.execute\(\)/);
  assert.match(source,/isReadyToPublish\(document\)/);
});

test('image Done waits for upload/autosave and invokes only the native block close',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  let syncing=false,closed=0,root;
  const container=({children})=>React.createElement('div',null,children);
  const api=load('sanity/components/ArticleImageEditor.tsx',{
    '@sanity/ui':{Card:container,Flex:container,Stack:container,Text:container,
      Button:({text,onClick,disabled})=>React.createElement('button',{onClick,disabled},text)},
    sanity:{useFormValue:path=>path[0]==='_id'?'drafts.test':'post',useSyncState:(id,type)=>{
      assert.equal(id,'test');assert.equal(type,'post');return {isSyncing:syncing};
    }},
  });
  let value={},passedProps;
  const child=React.createElement('input',{'aria-label':'Alt',defaultValue:'Unchanged'});
  const native=props=>{passedProps=props;return props.children;};
  const render=()=>React.createElement(api.ArticleImageBlock,{value,open:true,onClose:()=>closed++,renderDefault:native},child);
  try {
    root=createRoot(document.getElementById('root'));
    await act(async()=>root.render(render()));
    assert.equal(document.querySelector('button').disabled,true,'no image');
    value={asset:{_ref:'image-test'},_upload:{progress:50}};
    await act(async()=>root.render(render()));
    assert.equal(document.querySelector('button').disabled,true,'uploading');
    value={asset:{_ref:'image-test'}};syncing=true;
    await act(async()=>root.render(render()));
    assert.equal(document.querySelector('button').disabled,true,'saving');
    syncing=false;
    await act(async()=>root.render(render()));
    assert.equal(document.querySelector('button').disabled,false);
    assert.equal(passedProps.children.props.children[0],child,'native input chain intact');
    assert.equal(passedProps.value,value);
    await act(async()=>document.querySelector('button').click());
    assert.equal(closed,1);
    assert.equal(document.querySelector('input').value,'Unchanged');
  } finally {if(root)await act(async()=>root.unmount());Object.assign(globalThis,previous);dom.window.close();}
});
