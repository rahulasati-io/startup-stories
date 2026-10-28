import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import sharp from 'sharp';
import {ImageResponse} from 'next/og.js';
import {sidebarImageProps, sidebarImageUrl, generatedThumbnailSize, SIDEBAR_IMAGE_QUALITY} from '../lib/sidebar-image.ts';

const require = createRequire(import.meta.url);
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function compile(path, mocks = {}) {
  const code = ts.transpileModule(read(path), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
const src = 'https://cdn.sanity.io/images/project/production/image-1200x675.png';
test('Sanity sidebar URLs have three bounded variants, lower quality and a small fallback', () => {
  const props = sidebarImageProps(src);
  assert.equal(new URL(props.src).searchParams.get('w'), '88');
  const variants = props.srcSet.split(', ').map(value => value.split(' '));
  assert.deepEqual(variants.map(x => x[1]), ['88w', '176w', '264w']);
  for (const [url, descriptor] of variants) {
    const params = new URL(url).searchParams;
    assert.equal(params.get('w'), descriptor.slice(0, -1));
    assert.equal(params.get('q'), '65');
    assert.equal(params.get('auto'), 'format');
  }
  assert.equal(sidebarImageUrl(src, 5000), sidebarImageUrl(src, 264));
});
test('existing crop settings and aspect ratio survive resizing; external URLs are untouched', () => {
  const url = new URL(sidebarImageUrl(`${src}?w=1200&h=675&fit=crop&rect=0,0,1200,675`, 176));
  assert.equal(url.searchParams.get('h'), '99');
  assert.equal(url.searchParams.get('fit'), 'crop');
  assert.equal(url.searchParams.get('rect'), '0,0,1200,675');
  assert.deepEqual(sidebarImageProps('https://example.com/photo.webp'), {src: 'https://example.com/photo.webp', srcSet: undefined});
});
test('generated variants preserve content versions and cannot request arbitrary output dimensions', () => {
  const props = sidebarImageProps('/api/article-thumbnail/news/story?v=10&updated=123');
  assert.match(props.src, /v=10&updated=123&variant=sidebar&width=88/);
  for (const width of [88, 176, 264]) assert.deepEqual(generatedThumbnailSize(`https://misterstory.in/api/image?variant=sidebar&width=${width}`), {width, height: Math.round(width * 675 / 1200)});
  for (const width of ['999999', '-1', 'nope', '']) assert.deepEqual(generatedThumbnailSize(`https://misterstory.in/api/image?variant=sidebar&width=${width}`), {width: 176, height: 99});
  assert.deepEqual(generatedThumbnailSize('https://misterstory.in/api/image?width=88'), {width: 1200, height: 675});
});

test('real generated sidebar WebPs are compressed without clipping; default PNG output is unchanged', async () => {
  const GET = compile('app/api/article-thumbnail/[category]/[slug]/route.tsx', {
    'next/og': {ImageResponse},
    'next-sanity': {defineQuery: q => q},
    '@/sanity/lib/client': {client: {fetch: async () => ({title: 'How Example Company Makes Money', categoryTitle: 'Business Model', companyName: 'Example Company', industry: 'Software'})}},
    '@/lib/business-model-thumbnail': compile('lib/business-model-thumbnail.ts'),
    '@/lib/sidebar-image': {generatedThumbnailSize, SIDEBAR_IMAGE_QUALITY},
  }).GET;
  const image = async query => {
    const response = await GET(new Request(`https://misterstory.in/api/article-thumbnail/business-model/example${query}`), {params: Promise.resolve({category: 'business-model', slug: 'example'})});
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('content-type'), query ? 'image/webp' : 'image/png');
    assert.match(response.headers.get('cache-control'), /s-maxage=86400/);
    return Buffer.from(await response.arrayBuffer());
  };
  const full = await image('');
  const outputDir = process.env.SIDEBAR_IMAGE_QA_DIR;
  if (outputDir) {
    fs.mkdirSync(outputDir, {recursive: true});
    fs.writeFileSync(`${outputDir}/full.png`, full);
  }
  assert.equal((await sharp(full).metadata()).width, 1200);
  assert.equal((await sharp(full).metadata()).height, 675);
  for (const width of [88, 176, 264]) {
    const small = await image(`?variant=sidebar&width=${width}`);
    if (outputDir) fs.writeFileSync(`${outputDir}/small-${width}.webp`, small);
    const metadata = await sharp(small).metadata();
    assert.equal(metadata.width, width);
    assert.equal(metadata.format, 'webp');
    assert.equal(metadata.height, Math.round(width * 675 / 1200));
    assert.ok(small.length < full.length * 0.5, `${width}px should download less than half of the full PNG`);
    // Compare pixels to a resized reference so a clipped/blank small canvas cannot pass.
    const expected = await sharp(full).resize(width, metadata.height).removeAlpha().raw().toBuffer();
    const actual = await sharp(small).removeAlpha().raw().toBuffer();
    const error = actual.reduce((sum, v, i) => sum + Math.abs(v - expected[i]), 0) / actual.length;
    assert.ok(error < 20, `scaled artwork differs from reference: ${error}`);
    console.log(`Generated thumbnail ${width}px: ${small.length} bytes; full: ${full.length} bytes; pixel difference: ${error.toFixed(2)}`);
  }
});
