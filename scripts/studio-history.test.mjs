import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {JSDOM} from 'jsdom';
import {createBrowserHistory} from 'history';
import * as navigation from '../sanity/lib/draft-navigation.ts';
const require=createRequire(import.meta.url),compiled={exports:{}};
const source=fs.readFileSync(new URL('../sanity/lib/studio-history.ts',import.meta.url),'utf8');
new Function('require','module','exports',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText)(id=>id==='./draft-navigation'?navigation:require(id),compiled,compiled.exports);
const {createStudioHistory}=compiled.exports;
const path='/studio/structure/__edit__one%2Ctype%3Dpost';
const entry={id:'one',type:'post',title:'Test',dirty:true,syncing:false,ready:true,publishBlocked:null,discardBlocked:null,publish:()=>{},discard:()=>{}};
function setup(t){
  const dom=new JSDOM('',{url:'https://example.com'+path});t.after(()=>dom.window.close());
  const base=createBrowserHistory({window:dom.window}),history=createStudioHistory(base),guard=new navigation.DraftNavigationController();
  t.after(()=>guard.dispose());guard.update('pane',entry);
  const unblock=navigation.blockStudioNavigation(history,guard);t.after(unblock);
  return {dom,base,history,guard};
}
test('field/dialog URL changes pass through once without invoking or retrying departure guards',t=>{
  const {base,history,guard}=setup(t);let blocks=0,updates=0;
  const stop=history.blockDocumentNavigation(()=>blocks++);t.after(stop);
  const unlisten=history.listen(({location})=>{updates++;assert.equal(location.pathname,base.location.pathname);});t.after(unlisten);
  history.replace(path+'%2Cpath%3Dbody%255B_key%253D%253D%2522one%2522%255D',{focus:'alt'});
  assert.equal(blocks,0);assert.equal(updates,1);assert.equal(guard.pending,null);assert.equal(base.location.state.focus,'alt');
  history.push(path+'?field=body');assert.equal(blocks,0);assert.equal(updates,2);
});
test('leaving still requires a decision and keeping a draft never publishes it',t=>{
  const {history,guard}=setup(t);history.push('/studio/structure/articles');
  assert.ok(guard.pending);assert.equal(history.location.pathname,path);
  guard.cancel();assert.equal(history.location.pathname,path);
  history.push('/studio/structure/articles');guard.choose('keep');
  assert.equal(history.location.pathname,'/studio/structure/articles');assert.equal(guard.pending,null);
});
test('Back/Forward remain guarded and disposal does not reinstall removed blockers',async t=>{
  const {history,guard}=setup(t);
  history.push(path+'?field=body');history.push('/studio/structure/articles');guard.choose('keep');
  const waitFor=fn=>new Promise((resolve,reject)=>{let attempts=0;const timer=setInterval(()=>{if(fn()){clearInterval(timer);resolve();}else if(++attempts>100){clearInterval(timer);reject(Error('History timeout'));}},5);});
  history.back();await waitFor(()=>Boolean(guard.pending));
  guard.choose('keep');await waitFor(()=>history.location.pathname===path);assert.equal(guard.pending,null);
});
