import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const {JSDOM} = require('jsdom');
const base = process.env.SITE_HTML_BASE_URL;
if(base) assert.ok(['localhost','127.0.0.1','[::1]'].includes(new URL(base).hostname),'local production build only');
const read = path => fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const normalized = text => text.replace(/\s+/g,' ').trim();
const agents = ['Mozilla/5.0','Googlebot/2.1','Twitterbot/1.0'];
const fixtures = [
  ['/',true], ['/articles',true], ['/articles?page=2',true],
  ['/articles/why-rbi-wants-tata-sons-to-list',true,'Is Listing the Only Way to Reduce Financial Risk?'],
  ['/people',true], ['/people?page=2',true], ['/people?q=Aadit',false],
  ['/people/aadit-palicha',true,'Other leaders connected to Zepto'],
  ['/companies',true], ['/companies?page=2',true], ['/companies?q=Zepto',false],
  ['/companies/zepto',true,'People behind the company'],
  ['/authors',true], ['/authors/rahul-asati',true],
  ['/topics/business-model',true], ['/topics/strategy',true],
  ['/data',true], ['/data?q=repo',true], ['/data/rbi-repo-rate-history',true],
  ['/about',true], ['/contact',true], ['/editorial-policy',true], ['/privacy',true], ['/terms',true],
  ['/search?q=Zepto',false], ['/search',false],
  ...[...read('lib/data-library.ts').matchAll(/\{slug:'([^']+)'/g)]
    .map(match=>['/data/'+match[1],true])
    .filter(([path])=>path!=='/data/rbi-repo-rate-history'),
];

test('metadata blocking is universal; public profiles and footer contain no streaming boundaries',()=>{
  assert.match(read('next.config.ts'),/htmlLimitedBots: \/\.\*\//);
  for(const path of ['app/people/[slug]/page.tsx','app/companies/[slug]/page.tsx','components/Footer.tsx']) {
    assert.doesNotMatch(read(path),/<Suspense|ProfileSectionsLoading/);
  }
  for(const path of ['app/companies/page.tsx','app/people/page.tsx','app/search/page.tsx']) {
    assert.doesNotMatch(read(path),/force-static/,'query-dependent pages must not ignore filters');
  }
});

async function html(path,ua=agents[0]) {
  const response = await fetch(new URL(path,base),{headers:{'User-Agent':ua},signal:AbortSignal.timeout(45000)});
  return {response,doc:new JSDOM(await response.text()).window.document};
}

for(const [path,indexable,expectedText] of fixtures) {
  test(`complete initial HTML: ${path}`,{skip:!base},async()=>{
    for(const ua of agents) {
      const {response,doc} = await html(path,ua);
      assert.equal(response.status,200,ua);
      assert.ok(doc.head.querySelector('title')?.textContent,ua+': head title');
      assert.ok(doc.head.querySelector('meta[name="description"]')?.content,ua+': head description');
      if(!path.startsWith('/search')) {
        const canonical = doc.head.querySelector('link[rel="canonical"]')?.href;
        assert.ok(canonical?.startsWith('https://misterstory.in/'),ua+': canonical in head');
      }
      assert.equal([...doc.body.querySelectorAll('title')].filter(el=>el.namespaceURI==='http://www.w3.org/1999/xhtml').length,0,'HTML title must not be deferred to body (SVG chart titles are valid)');
      const noindex = [...doc.querySelectorAll('meta[name="robots"]')].some(e=>e.content.includes('noindex'));
      assert.equal(noindex,!indexable,'existing index/noindex intent');
      assert.ok(doc.querySelector('main h1'),ua+': main heading');
      assert.equal(doc.querySelector('main h1').closest('[hidden]'),null,'visible main heading without scripts');
      assert.equal(doc.querySelector('main[aria-busy="true"]'),null,'no loading shell');
      // Scripts never execute. Streamed hidden server segments must not contain public text or links.
      doc.querySelectorAll('script,style').forEach(el=>el.remove());
      for(const segment of doc.querySelectorAll('div[hidden][id^="S:"]')) {
        assert.equal(normalized(segment.textContent),'','no hidden streamed content');
        assert.equal(segment.querySelector('a,h1,h2,p,table'),null,'no hidden crawlable elements');
      }
      assert.equal(doc.querySelectorAll('footer').length,1,'one complete footer, not fallback plus streamed replacement');
      assert.ok(doc.querySelector('footer a[href="/data"]'));
      assert.ok(doc.querySelector('footer a[href^="/companies/"]'),'CMS footer navigation in initial HTML');
      if(expectedText) assert.ok(normalized(doc.querySelector('main').textContent).includes(expectedText),expectedText);
      assert.doesNotMatch(doc.querySelector('main').textContent,/Loading (person profile|company profile|related content|people…|companies…|data…|authors…)/);
    }
  });
}

test('pagination and filters produce distinct server-rendered content', {skip:!base},async()=>{
  const first = (await html('/companies')).doc;
  const second = (await html('/companies?page=2')).doc;
  const filtered = (await html('/companies?q=Zepto')).doc;
  const links = doc => [...doc.querySelectorAll('main a[href^="/companies/"]')].map(a=>a.getAttribute('href'));
  assert.notDeepEqual(links(first),links(second));
  assert.ok(links(filtered).includes('/companies/zepto'));
  assert.ok(links(filtered).length<links(first).length);
  assert.match(second.head.querySelector('link[rel="canonical"]').href,/\?page=2$/);
});

for(const family of ['people','companies','authors','topics','data','articles']) {
  test(`missing ${family} returns real 404 and noindex`,{skip:!base},async()=>{
    const {response,doc} = await html(`/${family}/__site-html-regression-missing__`);
    assert.equal(response.status,404);
    assert.ok(doc.querySelector('meta[name="robots"][content*="noindex"]'));
  });
}
