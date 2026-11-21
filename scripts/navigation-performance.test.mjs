import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import {parse} from 'groq-js';
import * as cache from '../lib/content-cache.ts';
import * as pagination from '../lib/directory-pagination.ts';

const require=createRequire(import.meta.url);
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
function load(path,mocks={}){
  const code=ts.transpileModule(read(path),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
  const mod={exports:{}};
  new Function('require','module','exports',code)(name=>{
    if(name in mocks)return mocks[name];
    if(name==='@/lib/content-cache')return cache;
    if(name==='@/sanity/lib/client')return {client:{fetch:()=>{throw Error('Unexpected CMS call');}}};
    if(name==='server-only')return {};
    if(name==='react')return {cache:fn=>fn};
    if(name==='next-sanity')return {defineQuery:q=>q};
    if(name==='@/lib/directory-pagination')return pagination;
    if(name==='@/lib/site-url')return {absoluteUrl:path=>'https://misterstory.in'+path};
    if(name==='@/lib/global-search')return {toSearchMatch:q=>q+'*'};
    if(name==='@/lib/article-directory-filter')return {ARTICLE_DIRECTORY_FILTER:'_type == "post"'};
    if(name==='next/navigation')return {notFound:()=>{throw Error('NOT_FOUND');}};
    if(name==='@/lib/profile-cache')return {PROFILE_CACHE_TAG:'published-profiles'};
    return require(name);
  },mod,mod.exports);
  return mod.exports;
}
const deferred=()=>{let resolve;const promise=new Promise(r=>{resolve=r;});return {promise,resolve};};

test('counts, options and cards begin before any directory request resolves',async()=>{
  const calls=[];
  const gates=[deferred(),deferred(),deferred()];
  const api=load('lib/public-directories.ts',{'@/sanity/lib/client':{client:{fetch:(...args)=>{
    calls.push(args);return gates[calls.length-1].promise;
  }}}});
  const result=api.getPublicDirectory('companies',{page:'2',industry:'Retail & E-commerce'});
  assert.equal(calls.length,3,'no waterfall before cards');
  for(const [query]of calls)assert.doesNotThrow(()=>parse(query));
  assert.doesNotMatch(calls[1][0],/category|_type == "post"/,'company filters fetch industries only');
  assert.match(calls[2][0],/\[24\.\.\.48\]/);
  gates[2].resolve([{_id:'a',name:'A'}]);
  gates[1].resolve({industries:['Retail & E-commerce']});
  gates[0].resolve(50);
  const output=await result;
  assert.equal(output.pagination.total,50);
  assert.equal(output.pagination.page,2);
  assert.equal(output.items[0].name,'A');
  assert.deepEqual(output.pagination.filters.map(f=>f.name),['industry']);
});

test('people skip filter-options fetch; out-of-range pages still fail',async()=>{
  let calls=0;
  const api=load('lib/public-directories.ts',{'@/sanity/lib/client':{client:{fetch:async q=>{
    calls++;return q.startsWith('count(')?1:[];
  }}}});
  await assert.rejects(api.getPublicDirectory('people',{page:'2'}),/NOT_FOUND/);
  assert.equal(calls,2);
  for(const page of ['0','-1','not-a-number','9007199254740991']){
    calls=0;await assert.rejects(api.getPublicDirectory('people',{page}),/NOT_FOUND/);assert.equal(calls,0);
  }
});

test('directory failures remain failures, not cached empty successful listings',async()=>{
  const api=load('lib/public-directories.ts',{'@/sanity/lib/client':{client:{fetch:async()=>{throw Error('outage');}}}});
  await assert.rejects(api.getPublicDirectory('companies',{}),/outage/);
});

test('canonical URLs and intentional filtered-page noindex remain unchanged',()=>{
  const api=load('lib/public-directories.ts');
  const canonical=api.directoryMetadata('people',{page:'2'},'People','Biographies');
  assert.equal(canonical.alternates.canonical,'https://misterstory.in/people?page=2');
  assert.equal(canonical.robots,undefined);
  assert.deepEqual(api.directoryMetadata('companies',{q:'example'},'Companies','Profiles').robots,{index:false,follow:true});
});

test('published cache dependencies preserve the 60-second fallback without a global profile tag',()=>{
  const core=cache.publicContentOptions(...cache.PEOPLE_DEPENDENCIES);
  const stories=cache.publicContentOptions('post','category');
  assert.equal(core.perspective,'published');assert.equal(core.stega,false);
  assert.equal(core.cache,'force-cache');assert.equal(core.next.revalidate,60);
  assert.ok(!core.next.tags.includes(cache.contentCacheTag('post')));
  assert.ok(stories.next.tags.includes(cache.contentCacheTag('post')));
  assert.ok(core.next.tags.includes(cache.contentCacheTag('companyPersonRole')));
  assert.ok(core.next.tags.includes(cache.contentCacheTag('sanity.imageAsset')));
  assert.equal(new Set(cache.publicContentOptions('post','post').next.tags).size,2);
});

test('signed publishing, deletion and slug-change payloads invalidate only their dependency type',async()=>{
  const before=process.env.SANITY_REVALIDATE_SECRET;process.env.SANITY_REVALIDATE_SECRET='test-only';
  try{
    for(const type of cache.KNOWN_CONTENT_TYPES){
      for(const slug of ['new-slug',null]){
        const calls=[];
        const api=load('app/api/revalidate/route.ts',{
          'next/cache':{revalidateTag:(...args)=>calls.push(['tag',...args]),revalidatePath:(...args)=>calls.push(['path',...args])},
          'next/server':{NextResponse:{json:(body,init)=>({body,status:init?.status||200})}},
          'next-sanity/webhook':{parseBody:async(_request,_secret,wait)=>{assert.equal(wait,true);return {isValidSignature:true,body:{_type:type,slug}};}},
        });
        const response=await api.POST({headers:new Headers({'sanity-webhook-signature':'test'})});
        assert.equal(response.status,200);
        assert.deepEqual(calls,[['tag',cache.contentCacheTag(type),{expire:0}]]);
      }
    }
  }finally{if(before===undefined)delete process.env.SANITY_REVALIDATE_SECRET;else process.env.SANITY_REVALIDATE_SECRET=before;}
});

test('missing/unknown webhook types keep a safe legacy fallback, never silently skip refresh',async()=>{
  const before=process.env.SANITY_REVALIDATE_SECRET;process.env.SANITY_REVALIDATE_SECRET='test-only';
  try{
    for(const body of [null,{}, {_type:'new-unmapped-type'}]){
      const calls=[];
      const api=load('app/api/revalidate/route.ts',{
        'next/cache':{revalidateTag:(...args)=>calls.push(['tag',...args]),revalidatePath:(...args)=>calls.push(['path',...args])},
        'next/server':{NextResponse:{json:(body,init)=>({body,status:init?.status||200})}},
        'next-sanity/webhook':{parseBody:async()=>({isValidSignature:true,body})},
      });
      assert.equal((await api.POST({headers:new Headers({'sanity-webhook-signature':'test'})})).status,200);
      assert.deepEqual(calls,[['tag','published-profiles',{expire:0}],['path','/','layout']]);
    }
  }finally{if(before===undefined)delete process.env.SANITY_REVALIDATE_SECRET;else process.env.SANITY_REVALIDATE_SECRET=before;}
});

test('all manually cached public query sites are dependency-tagged; sitemaps stay uncached',()=>{
  for(const path of ['app/page.tsx','app/articles/[slug]/page.tsx','app/authors/page.tsx','app/authors/[slug]/page.tsx','app/topics/[slug]/page.tsx','app/companies/[slug]/page.tsx','app/people/[slug]/page.tsx','components/CompanyRow.tsx','components/PeopleRow.tsx','components/Topics.tsx','components/DirectoryPageLayout.tsx','lib/public-directories.ts','lib/directory-page-settings.ts','lib/data-featured-stories.ts']){
    const source=read(path);
    assert.match(source,/publicContentOptions/,path);
    assert.doesNotMatch(source,/next:\s*\{\s*revalidate:\s*60\s*\}/,path);
  }
  assert.match(read('lib/sitemap-data.ts'),/cache: "no-store"/);
  assert.match(read('lib/sitemap-data.ts'),/useCdn: false/);
  assert.match(read('app/feed.xml/route.ts'),/cache: "no-store"/);
});
