import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=path=>fs.readFileSync(new URL(`../${path}`,import.meta.url),'utf8');

test('root metadata leaves indexing implicit without a site-wide robots override',()=>{
  const root=read('app/layout.tsx');
  assert.doesNotMatch(root,/\brobots\s*:/);
  assert.doesNotMatch(root,/googleBot\s*:/);
});

test('intentional route-level restrictions remain in place',()=>{
  assert.match(read('app/search/page.tsx'),/robots:\s*\{\s*index:\s*false,\s*follow:\s*true\s*\}/);
  assert.match(read('app/topics/[slug]/page.tsx'),/robots:\s*\{\s*index:\s*topic\.articleCount\s*>\s*0,\s*follow:\s*true\s*\}/);
  assert.match(read('app/data/[slug]/page.tsx'),/robots:\{index:!page\.reviewRequired&&!page\.withheld,follow:true\}/);
  assert.match(read('app/studio/[[...tool]]/page.tsx'),/export \{ metadata, viewport \} from "next-sanity\/studio"/);
  assert.match(read('app/robots.ts'),/disallow: \["\/studio\/", "\/api\/search", "\/api\/newsletter"\]/);
});
