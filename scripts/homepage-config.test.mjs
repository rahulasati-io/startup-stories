import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DEFAULT_HOME_SECTIONS, homepageSections, homepageHref, selectHomepageArticles, selectFeaturedHomepageArticles} from '../lib/homepage-config.ts';

test('unset settings preserve the existing eight sections and funding before business models', () => {
  assert.equal(homepageSections(null).length, 8);
  assert.deepEqual(homepageSections(undefined).slice(0, 4).map(s => s._key), ['featured', 'funding', 'business', 'latest']);
});
test('explicitly empty sections stay empty instead of restoring defaults', () => {
  assert.deepEqual(homepageSections([]), []);
});
test('editorial ordering and visibility are preserved without mutating settings', () => {
  const sections = [{_key:'second', kind:'text'}, {_key:'hidden', kind:'text', enabled:false}, {_key:'first', kind:'text'}];
  assert.deepEqual(homepageSections(sections).map(s => s._key), ['second', 'first']);
  assert.equal(sections.length, 3);
});
test('unsafe or external homepage destinations fall back to a safe path', () => {
  for (const value of ['javascript:alert(1)', '//evil.com', '/\\evil.com', 'https://evil.com', '/bad\npath']) {
    assert.equal(homepageHref(value, '/articles'), '/articles');
  }
  assert.equal(homepageHref('/articles?q=EV&page=2', '/'), '/articles?q=EV&page=2');
});
test('latest stories defaults to excluding funding and default section keys are unique', () => {
  assert.equal(DEFAULT_HOME_SECTIONS.find(s => s._key === 'latest').excludeFunding, true);
  assert.equal(new Set(DEFAULT_HOME_SECTIONS.map(s => s._key)).size, DEFAULT_HOME_SECTIONS.length);
});

const articles = [
  {_id:'model',categorySlug:'business-model'},
  {_id:'funding',categorySlug:'funding-news'},
  {_id:'featured',categorySlug:'company-story'},
  {_id:'economy',categorySlug:'economy'},
  {_id:'results',categorySlug:'results'},
];
const latest = DEFAULT_HOME_SECTIONS.find(s => s._key === 'latest');
test('latest skips featured and earlier category stories and reserves its own selections',()=>{
  const used=new Set(['model','funding','featured']);
  assert.deepEqual(selectHomepageArticles(latest,articles,used).map(a=>a._id),['economy','results']);
  assert.deepEqual([...used],['model','funding','featured','economy','results']);
});
test('saved latest settings honour funding and category filters',()=>{
  assert.deepEqual(selectHomepageArticles({...latest,excludeFunding:true},articles,new Set()).map(a=>a._id),['model','featured','economy','results']);
  assert.deepEqual(selectHomepageArticles({...latest,excludeFunding:false,categorySlug:'funding-news'},articles,new Set()).map(a=>a._id),['funding']);
});
test('manual latest selection preserves order and skips unavailable, duplicate and already shown stories',()=>{
  const section={...latest,articleIds:['results','model','missing','results','funding']};
  assert.deepEqual(selectHomepageArticles(section,articles,new Set(['results','funding'])).map(a=>a._id),['model']);
  assert.deepEqual(selectHomepageArticles(section,articles,new Set()).map(a=>a._id),['results','model','funding']);
});
test('moving latest above category shelves claims stories from those later shelves',()=>{
  const used=new Set(['featured']);
  selectHomepageArticles(latest,articles,used);
  assert.deepEqual(selectHomepageArticles({_key:'funding',kind:'articles',categorySlug:'funding-news'},articles,used).map(a=>a._id),['funding']);
  assert.deepEqual(selectHomepageArticles({_key:'business',kind:'articles',categorySlug:'business-model'},articles,used).map(a=>a._id),[]);
});
test('other shelves retain shared deduplication and explicit funding filters',()=>{
  const used=new Set(['featured']);
  assert.deepEqual(selectHomepageArticles({_key:'other',kind:'articles',excludeFunding:true},articles,used).map(a=>a._id),['model','economy','results']);
  assert.deepEqual(selectHomepageArticles({_key:'other2',kind:'articles',excludeFunding:true},articles,used),[]);
});
test('latest honours limits and cannot repeat the same card within its own shelf',()=>{
  assert.deepEqual(selectHomepageArticles({...latest,limit:2},[articles[1],articles[1],...articles],new Set()).map(a=>a._id),['model','featured']);
  assert.deepEqual(selectHomepageArticles(latest,[],new Set()),[]);
});

test('one lead and four supporting selections take precedence over the legacy second highlight',()=>{
  const items=Array.from({length:8},(_,i)=>({_id:String(i)}));
  const settings={featuredArticleId:'1',secondFeaturedArticleId:'2',supportingFeaturedArticleIds:['3','4','5','6']};
  assert.deepEqual(selectFeaturedHomepageArticles(items,settings).map(item=>item._id),['1','3','4','5','6']);
  assert.equal(settings.secondFeaturedArticleId,'2');
});

test('legacy second selection fills only a spare slot; unavailable/duplicate picks do not introduce latest uploads',()=>{
  const items=Array.from({length:8},(_,i)=>({_id:String(i)}));
  assert.deepEqual(selectFeaturedHomepageArticles(items,{featuredArticleId:'1',secondFeaturedArticleId:'2',supportingFeaturedArticleIds:['3','3','missing']}).map(item=>item._id),['1','3','2']);
  assert.deepEqual(selectFeaturedHomepageArticles(items,{featuredArticleId:'missing'}),[]);
  assert.deepEqual(selectFeaturedHomepageArticles(items,null).map(item=>item._id),['0','1','2','3','4']);
});
