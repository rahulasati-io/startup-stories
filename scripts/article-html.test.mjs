import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {createClient} from '@sanity/client';
import {encodeSignatureHeader} from '@sanity/webhook';
import {articleDescription} from '../lib/article-description.ts';
const require = createRequire(import.meta.url);
const {JSDOM} = require('jsdom');
const read = path => fs.readFileSync(new URL('../' + path, import.meta.url), 'utf8');
const normalize = text => text.replace(/\s+/g, ' ').trim();

test('article route uses on-demand static HTML, with new slugs and invalidation preserved', () => {
  const source = read('app/articles/[slug]/page.tsx');
  assert.match(source, /export const dynamic = "force-static"/);
  assert.match(source, /export const revalidate = 60/);
  assert.match(source, /export const dynamicParams = true/);
  assert.match(source, /publicContentOptions\(\.\.\.ARTICLE_DEPENDENCIES\)/);
  assert.match(source, /const description = articleDescription\(article\)/);
  assert.equal((source.match(/^\s+description,$/gm) || []).length, 3);
  assert.match(read('app/api/revalidate/route.ts'), /revalidateTag\(contentCacheTag\(type\), \{expire: 0\}\)/);
});

test('description preserves editorial overrides and falls back to readable article text', () => {
  assert.equal(articleDescription({title:'Title', seoDescription:'  Editorial description  '}), 'Editorial description');
  assert.equal(articleDescription({title:'Title', seoDescription:' ', body:[
    {_type:'image'}, {_type:'block',children:[{text:'First '},{text:'paragraph.\n More text.'}]},
  ]}), 'First paragraph. More text.');
  assert.equal(articleDescription({title:'Title',body:[{_type:'block',children:[{text:'x'.repeat(200)}]}]}).length,160);
  assert.equal(articleDescription({title:'Title', body:[{_type:'image'}]}),'Title');
});

// Opt-in production integration: no browser scripts execute and no CMS writes.
// node --env-file=.env.local --experimental-strip-types --test scripts/article-html.test.mjs
// Set ARTICLE_HTML_BASE_URL to the local `next start` URL first.
const base = process.env.ARTICLE_HTML_BASE_URL;
if (base) assert.ok(['127.0.0.1','localhost','[::1]'].includes(new URL(base).hostname), 'integration tests must target a local server');
const slugs = ['why-rbi-wants-tata-sons-to-list','how-eatclub-makes-money','rotoris-raises-series-a-funding'];
for (const slug of slugs) {
  test(`production raw HTML contains complete article and initial-head metadata: ${slug}`, {skip:!base}, async () => {
    const client = createClient({projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
      dataset:process.env.NEXT_PUBLIC_SANITY_DATASET, apiVersion:'2025-01-01', useCdn:false,
      perspective:'published', stega:false});
    const article = await client.fetch('*[_type == "post" && slug.current == $slug][0]{title,seoTitle,seoDescription,body,publishedAt,contentUpdatedAt}', {slug});
    assert.ok(article, 'published comparison article exists');
    for (const ua of ['Mozilla/5.0', 'Googlebot/2.1', 'Twitterbot/1.0']) {
      const response = await fetch(new URL('/articles/'+slug,base), {headers:{'User-Agent':ua}});
      assert.equal(response.status,200,ua);
      // JSDOM does NOT execute scripts: hidden streamed segments cannot pass as visible text.
      const doc = new JSDOM(await response.text()).window.document;
      assert.equal(doc.head.querySelector('title')?.textContent, article.seoTitle || article.title,ua);
      assert.equal(doc.head.querySelector('meta[name="description"]')?.content, articleDescription(article),ua);
      assert.equal(doc.head.querySelector('link[rel="canonical"]')?.href,'https://misterstory.in/articles/'+slug,ua);
      assert.equal(doc.body.querySelector('title'),null,'metadata not deferred into body');
      assert.equal(doc.querySelector('meta[name="robots"][content*="noindex"]'),null);
      assert.equal(doc.querySelector('main[aria-busy="true"]'),null,'no loading shell');
      doc.querySelectorAll('script,style').forEach(el=>el.remove());
      const main = doc.querySelector('main');
      assert.ok(main);
      assert.equal(main.closest('[hidden]'),null);
      assert.equal(main.querySelector('[hidden] article'),null,'article is not in hidden streamed segments');
      const text = normalize(main.textContent);
      for (const block of article.body || []) {
        if(block._type !== 'block') continue;
        const expected = normalize((block.children || []).map(child=>child.text || '').join(''));
        if(expected) assert.ok(text.includes(expected),`${ua}: missing body block: ${expected.slice(0,70)}`);
      }
      for (const image of (article.body || []).filter(b=>b._type==='image' && b.asset?._ref)) {
        assert.ok([...main.querySelectorAll('img')].some(img=>img.src.includes(image.asset._ref.replace(/^image-/,'').replace(/-([^-]+)$/,'.$1'))), 'body image exists without JavaScript');
      }
    }
  });
}

test('unknown article returns real 404 with noindex rather than an indexable loading shell', {skip:!base}, async()=>{
  const response = await fetch(new URL('/articles/__article-html-regression-missing__',base));
  assert.equal(response.status,404);
  const doc = new JSDOM(await response.text()).window.document;
  assert.ok(doc.querySelector('meta[name="robots"][content*="noindex"]'));
});

test('local signed webhook expires generated article HTML without a rebuild', {
  skip:!base || !process.env.SANITY_REVALIDATE_SECRET,
}, async()=>{
  const url = new URL('/articles/'+slugs[0],base);
  const warm = await fetch(url); await warm.text();
  const body = JSON.stringify({_type:'post',slug:slugs[0]});
  const signature = await encodeSignatureHeader(body,Date.now(),process.env.SANITY_REVALIDATE_SECRET);
  const invalidation = await fetch(new URL('/api/revalidate',base), {
    method:'POST',headers:{'Content-Type':'application/json','sanity-webhook-signature':signature},body,
  });
  assert.equal(invalidation.status,200);
  assert.equal((await invalidation.json()).ok,true);
  const fresh = await fetch(url);
  assert.equal(fresh.status,200);
  assert.equal(fresh.headers.get('x-nextjs-cache'),'MISS');
  const doc = new JSDOM(await fresh.text()).window.document;
  assert.ok(doc.head.querySelector('title'));
  assert.equal(doc.querySelector('main[aria-busy="true"]'),null);
  assert.ok([...doc.querySelectorAll('main h2')].some(e=>e.textContent==='Is Listing the Only Way to Reduce Financial Risk?'));
  const cached = await fetch(url); await cached.text();
  assert.equal(cached.headers.get('x-nextjs-cache'),'HIT');
});
