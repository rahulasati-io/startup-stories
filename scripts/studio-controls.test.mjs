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

test('image Done waits for upload/autosave and only opens/focuses the parent form path',async()=>{
  const dom=new JSDOM('<div id="root"></div>');
  const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  let syncing=false,root;
  const navigation=[];
  const container=({children})=>React.createElement('div',null,children);
  const api=load('sanity/components/ArticleImageEditor.tsx',{
    '@sanity/ui':{Card:container,Flex:container,Stack:container,Text:container,
      Button:({text,onClick,disabled})=>React.createElement('button',{onClick,disabled},text)},
    sanity:{useFormCallbacks:()=>({onPathOpen:path=>navigation.push(['open',path]),onPathFocus:path=>navigation.push(['focus',path])}),useFormValue:path=>path[0]==='_id'?'drafts.test':'post',useSyncState:(id,type)=>{
      assert.equal(id,'test');assert.equal(type,'post');return {isSyncing:syncing};
    }},
  });
  let value={},passedProps;
  const relativePath=['body',{_key:'new-image'}];
  const NativeInput=()=>React.createElement('input',{'aria-label':'Alt',defaultValue:'Unchanged'});
  const child=React.createElement(NativeInput);
  const native=props=>{
    passedProps=props;
    return child;
  };
  let inputProps;
  const render=()=>{inputProps={path:relativePath,value,renderDefault:native};return React.createElement(api.ArticleImageInput,inputProps);};
  try {
    root=createRoot(document.getElementById('root'));
    await act(async()=>root.render(render()));
    const originalInput=document.querySelector('input');
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
    assert.equal(passedProps.path,relativePath,'native input path reference retained');
    assert.equal(passedProps.renderDefault,inputProps.renderDefault,'native rendering chain retained');
    assert.equal(passedProps.value,value);
    assert.equal(document.querySelector('input'),originalInput,'input is not remounted across upload/save updates');
    await act(async()=>document.querySelector('button').click());
    assert.deepEqual(navigation,[['open',['body']],['focus',['body']]]);
    assert.equal(document.querySelector('input').value,'Unchanged');
  } finally {if(root)await act(async()=>root.unmount());Object.assign(globalThis,previous);dom.window.close();}
});

test('Done is input-only and leaves native image block/dialog rendering unmodified',()=>{
  const schema=read('sanity/schemaTypes/blockContentType.ts');
  assert.match(schema,/components: \{input: ArticleImageInput\}/);
  assert.doesNotMatch(schema,/block: ArticleImage/);
  const source=read('sanity/components/ArticleImageEditor.tsx');
  assert.match(source,/props\.renderDefault\(props\)/);
  assert.doesNotMatch(source,/useDialogStack|window\.|document\.|\.execute\(|\.commit\(/);
  // Installed Sanity uses the same close operations, and reads native-child paths.
  const sanitySource=fs.readdirSync(new URL('../node_modules/sanity/lib/',import.meta.url))
    .filter(name=>name==='index.js'||/^getExpandOperations-.*\.js$/.test(name))
    .map(name=>read('node_modules/sanity/lib/'+name)).join('\n');
  const start=sanitySource.indexOf('function EnhancedObjectDialog(');
  assert.notEqual(start,-1,'installed native dialog implementation is present');
  const dialog=sanitySource.slice(start,start+900);
  assert.match(dialog,/absolutePath,[\s\S]*path[\s\S]*children\?\.props/);
  assert.match(dialog,/currentPath = absolutePath \|\| path/);
  assert.match(sanitySource,/onPathOpen\(parentPath_0\), onPathFocus\(parentPath_0\)/);
});
