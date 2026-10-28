import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import * as config from '../lib/homepage-config.ts';

test('approved homepage title and description include funding without an ampersand', () => {
  assert.equal(config.DEFAULT_HOME_TITLE, 'MisterStory: Business News, Startup Funding and Company Analysis');
  assert.equal(config.DEFAULT_HOME_DESCRIPTION, 'Explore Indian business news, startup funding, company financials and clear breakdowns of how businesses make money.');
  assert.doesNotMatch(config.DEFAULT_HOME_TITLE, /&/);
  for (const value of [null, undefined, {}, {seoTitle: ' ', seoDescription: ''}]) {
    assert.deepEqual(config.resolveHomepageSeo(value), {title: config.DEFAULT_HOME_TITLE, description: config.DEFAULT_HOME_DESCRIPTION});
  }
});
test('saved legacy defaults are replaced without mutating Sanity settings', () => {
  for (const title of ['MisterStory — Company News, Financials & Business Stories', 'MisterStory: Company News, Financials & Business Stories']) {
    const settings = Object.freeze({seoTitle: title, seoDescription: 'Understand companies through business news, financial results, funding updates and clear explanations of how they make money.'});
    assert.deepEqual(config.resolveHomepageSeo(settings), {title: config.DEFAULT_HOME_TITLE, description: config.DEFAULT_HOME_DESCRIPTION});
    assert.equal(settings.seoTitle, title);
  }
});
test('custom SEO values remain editable and the existing homepage heading is unchanged', () => {
  assert.deepEqual(config.resolveHomepageSeo({seoTitle: ' Custom title ', seoDescription: ' Custom description '}), {title: 'Custom title', description: 'Custom description'});
  assert.equal(config.DEFAULT_HOME_HEADING, 'Company News & Business Stories');
});
test('homepage metadata uses identical approved SEO copy across search and sharing, preserving canonical and image', async () => {
  const source = fs.readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8');
  const output = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  const module = {exports: {}};
  const require = createRequire(import.meta.url);
  const mocks = {
    '@/lib/homepage-config': config,
    '@/lib/site-url': {absoluteUrl: path => new URL(path, 'https://misterstory.in/').href},
    '@/sanity/lib/client': {client: {fetch: async () => ({seoTitle: 'MisterStory: Company News, Financials & Business Stories', socialImageUrl: 'https://cdn.sanity.io/example.webp'})}},
  };
  new Function('require', 'module', 'exports', output)(name => mocks[name] ?? (name.startsWith('@/') ? {__esModule: true, default: () => null} : require(name)), module, module.exports);
  const metadata = await module.exports.generateMetadata();
  for (const entry of [metadata, metadata.openGraph, metadata.twitter]) {
    assert.equal(entry.title, config.DEFAULT_HOME_TITLE);
    assert.equal(entry.description, config.DEFAULT_HOME_DESCRIPTION);
  }
  assert.equal(metadata.alternates.canonical, 'https://misterstory.in/');
  assert.equal(metadata.openGraph.images[0].url, 'https://cdn.sanity.io/example.webp');
  assert.equal(metadata.twitter.images[0], 'https://cdn.sanity.io/example.webp');
  assert.equal(metadata.robots, undefined);
});
