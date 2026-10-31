import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {createMemoryHistory, createBrowserHistory} from 'history';
import {JSDOM} from 'jsdom';
import {blockStudioNavigation, DraftNavigationController, studioDocumentPath} from '../sanity/lib/draft-navigation.ts';
import * as navigation from '../sanity/lib/draft-navigation.ts';

const documentEntry=(overrides={})=>({id:'one',type:'company',title:'Company One',dirty:true,syncing:false,ready:true,publishBlocked:null,discardBlocked:null,publish:()=>{},discard:()=>{},...overrides});
const setup=t=>{const guard=new DraftNavigationController();t.after(()=>guard.dispose());return guard;};

test('only articles can be kept as drafts; leaving never publishes automatically',t=>{
  const guard=setup(t);let publishes=0,leaves=0;
  guard.update('pane',documentEntry({publish:()=>publishes++}));guard.request(()=>leaves++);
  guard.choose('keep');assert.equal(leaves,0);assert.equal(publishes,0);
  guard.cancel();assert.equal(guard.pending,null);assert.equal(guard.hasDrafts,true);
  guard.update('pane',documentEntry({type:'post'}));guard.request(()=>leaves++);guard.choose('keep');
  assert.equal(leaves,1);assert.equal(guard.hasDrafts,true);assert.equal(publishes,0);
});

test('discard waits for operation success AND draft disappearance, in either order',t=>{
  for(const successFirst of [true,false]){
    const guard=setup(t);let discarded=0,leaves=0;
    const base=documentEntry({discard:()=>discarded++});guard.update('pane',base);guard.request(()=>leaves++);guard.choose('discard');
    assert.equal(discarded,1);assert.equal(leaves,0);
    const event={type:'success',op:'discardChanges'};
    guard.update('pane',{...base,dirty:successFirst,operationEvent:successFirst?event:undefined});
    assert.equal(leaves,0);
    guard.update('pane',{...base,dirty:false,operationEvent:event});assert.equal(leaves,1);
  }
});

test('pending saves, validation and permissions block resolution',t=>{
  const guard=setup(t);let writes=0;
  const base=documentEntry({publish:()=>writes++,discard:()=>writes++});
  guard.update('pane',{...base,syncing:true});guard.request(()=>{});guard.choose('discard');assert.equal(writes,0);
  guard.update('pane',{...base,publishBlocked:'Validation failed',discardBlocked:'No permission'});
  guard.choose('publish');guard.choose('discard');assert.equal(writes,0);
  guard.update('pane',{...base,ready:false});guard.choose('publish');assert.equal(writes,0);
});

test('operation errors retain the editor and draft; stale success events cannot complete a new request',t=>{
  const guard=setup(t);let leaves=0;
  const oldEvent={type:'success',op:'publish'},base=documentEntry({operationEvent:oldEvent});
  guard.update('pane',base);guard.request(()=>leaves++);guard.choose('publish');
  guard.update('pane',{...base,dirty:false});assert.equal(leaves,0);
  guard.update('pane',{...base,operationEvent:{type:'error',op:'publish',error:Error('Offline')}});
  assert.equal(guard.pending.error,'Offline');assert.equal(leaves,0);assert.equal(guard.hasDrafts,true);
  guard.cancel();assert.equal(guard.pending,null);
});

test('publish waits for syncing to settle after successful publication',t=>{
  const guard=setup(t);let leaves=0;
  const base=documentEntry();guard.update('pane',base);guard.request(()=>leaves++);guard.choose('publish');
  const operationEvent={type:'success',op:'publish'};
  guard.update('pane',{...base,dirty:false,syncing:true,operationEvent});assert.equal(leaves,0);
  guard.update('pane',{...base,dirty:false,operationEvent});assert.equal(leaves,1);
});

test('multiple dirty documents require separate decisions, duplicate panes do not duplicate prompts',t=>{
  const guard=setup(t);let leaves=0;
  guard.update('a',documentEntry({type:'post'}));guard.update('a-split',documentEntry({type:'post'}));
  const second=documentEntry({id:'two'});guard.update('b',second);guard.request(()=>leaves++);
  assert.equal(guard.pending.ids.length,2);guard.choose('keep');assert.equal(guard.current.id,'two');assert.equal(leaves,0);
  guard.choose('discard');guard.update('b',{...second,dirty:false,operationEvent:{type:'success',op:'discardChanges'}});
  assert.equal(leaves,1);
});

test('memory history blocks click/programmatic navigation and supports Stay and Keep',t=>{
  const guard=setup(t),history=createMemoryHistory({initialEntries:['/studio/structure/__edit__one,type=post']});
  guard.update('pane',documentEntry({type:'post'}));const unblock=blockStudioNavigation(history,guard);t.after(unblock);
  history.push('/studio/structure/company');assert.match(history.location.pathname,/__edit__one/);assert.ok(guard.pending);
  guard.cancel();assert.match(history.location.pathname,/__edit__one/);
  history.push('/studio/structure/company');guard.choose('keep');assert.equal(history.location.pathname,'/studio/structure/company');
});

test('view/field/search changes do not trigger a departure dialog',t=>{
  const guard=setup(t),history=createMemoryHistory({initialEntries:['/studio/structure/__edit__one,type=post']});
  guard.update('pane',documentEntry({type:'post'}));const unblock=blockStudioNavigation(history,guard);t.after(unblock);
  history.replace('/studio/structure/__edit__one,type=post,view=preview?field=body');assert.equal(guard.pending,null);
  assert.equal(studioDocumentPath('/studio/structure/__edit__one%2Ctype%3Dpost'),'/studio/structure/__edit__one');
});

test('asynchronous browser Back retries do not re-open the same prompt',async t=>{
  const dom=new JSDOM('',{url:'https://example.com/studio/structure/list'});t.after(()=>dom.window.close());
  const history=createBrowserHistory({window:dom.window});
  history.push('/studio/structure/__edit__one,type=post');
  const guard=setup(t);guard.update('pane',documentEntry({type:'post'}));const unblock=blockStudioNavigation(history,guard);t.after(unblock);
  const waitFor=check=>new Promise((resolve,reject)=>{let tries=0;const timer=setInterval(()=>{if(check()){clearInterval(timer);resolve();}else if(++tries>100){clearInterval(timer);reject(Error('History transition timed out'));}},5);});
  history.back();await waitFor(()=>Boolean(guard.pending));
  assert.match(history.location.pathname,/__edit__one/);guard.choose('keep');
  await waitFor(()=>history.location.pathname==='/studio/structure/list');
  assert.equal(guard.pending,null);
});

const require=createRequire(import.meta.url);
function compileComponents(mocks){
  const source=fs.readFileSync(new URL('../sanity/components/DraftNavigationGuard.tsx',import.meta.url),'utf8');
  const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const compiled={exports:{}};new Function('require','module','exports',code)(id=>mocks[id]??require(id),compiled,compiled.exports);return compiled.exports;
}

test('rendered guard preserves published content on Discard and exposes only the allowed article/profile choices',async()=>{
  const dom=new JSDOM('<div id="test-root"></div>',{url:'https://example.com/studio'});
  const previous={window:globalThis.window,document:globalThis.document,IS_REACT_ACT_ENVIRONMENT:globalThis.IS_REACT_ACT_ENVIRONMENT};
  Object.assign(globalThis,{window:dom.window,document:dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
  let root;
  try{
    for(const type of ['company','founder','author','homepageSettings','post']){
      const history=createMemoryHistory({initialEntries:['/studio/structure/__edit__one,type='+type]});
      const historyContext=React.createContext(history),listeners=new Set();
      const originalPublished={_id:'one',_type:type,title:'Original live title'};
      let state={ready:true,draft:{_id:'drafts.one',_type:type,title:'Unpublished title'},published:originalPublished,version:null};
      let event,discardCalls=0,publishCalls=0;
      const notify=()=>{for(const fn of listeners)fn();};
      const subscribe=fn=>{listeners.add(fn);return()=>listeners.delete(fn);};
      const useState=()=>React.useSyncExternalStore(subscribe,()=>state,()=>state);
      const operations={publish:{disabled:false,execute:()=>publishCalls++},discardChanges:{disabled:false,execute:()=>{
        discardCalls++;event={type:'success',op:'discardChanges'};state={...state,draft:null};notify();
      }}};
      const container=({children})=>React.createElement('div',null,children);
      const ui={Box:container,Stack:container,Flex:container,Card:container,
        Text:({children,role})=>React.createElement('p',{role},children),
        Button:({text,onClick,disabled})=>React.createElement('button',{onClick,disabled},text),
        Dialog:({children,header,onClose})=>React.createElement('section',{role:'dialog'},React.createElement('h2',null,header),children,onClose&&React.createElement('button',{onClick:onClose},'Close'))};
      const components=compileComponents({'@sanity/ui':ui,'sanity/_singletons':{RouterHistoryContext:historyContext},'../lib/draft-navigation':navigation,'sanity':{
        getPublishedId:id=>id.replace(/^drafts\./,''),useEditState:useState,useSyncState:()=>({isSyncing:false}),useDocumentOperation:()=>operations,
        useDocumentOperationEvent:()=>event,useValidationStatus:()=>({isValidating:false,validation:[]}),useDocumentPairPermissions:()=>[{granted:true},false],usePerspective:()=>({}),
      }});
      root=createRoot(document.getElementById('test-root'));
      await act(async()=>root.render(React.createElement(React.StrictMode,null,React.createElement(components.StudioDraftGuardLayout,{renderDefault:()=>React.createElement(components.GuardedDocumentLayout,{documentId:'one',documentType:type,renderDefault:()=>React.createElement('p',null,'Editor')})}))));
      await act(async()=>history.push('/studio/structure/list'));
      assert.ok(document.querySelector('[role="dialog"]'));
      const buttons=[...document.querySelectorAll('button')];
      assert.equal(buttons.some(b=>b.textContent==='Keep draft and leave'),type==='post');
      assert.equal(buttons.some(b=>b.textContent==='Publish and leave'),type!=='post');
      await act(async()=>buttons.find(b=>b.textContent==='Discard changes').click());
      assert.equal(discardCalls,1);assert.equal(publishCalls,0);assert.equal(state.published,originalPublished);assert.equal(state.draft,null);
      assert.equal(history.location.pathname,'/studio/structure/list');
      assert.equal(document.querySelector('[role="dialog"]'),null);
      await act(async()=>root.unmount());root=null;
    }
  }finally{if(root)await act(async()=>root.unmount());Object.assign(globalThis,previous);dom.window.close();}
});

test('guard integration has no auto-publish/live-edit or unload-time mutations',()=>{
  const config=fs.readFileSync(new URL('../sanity.config.ts',import.meta.url),'utf8');
  const component=fs.readFileSync(new URL('../sanity/components/DraftNavigationGuard.tsx',import.meta.url),'utf8');
  assert.match(config,/layout: StudioDraftGuardLayout/);assert.match(config,/unstable_layout: GuardedDocumentLayout/);
  assert.doesNotMatch(component,/\.delete\(|\.del\.|liveEdit:\s*true|sendBeacon|addEventListener\(["']pagehide/);
  assert.match(component,/discard: \(\) => operations\.discardChanges\.execute\(\)/);
});
