import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const require = createRequire(import.meta.url);
const read = path => fs.readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function compile(path, mocks = {}) {
  const code = ts.transpileModule(read(path), {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
  const module = {exports: {}};
  new Function('require', 'module', 'exports', code)(name => mocks[name] ?? require(name), module, module.exports);
  return module.exports;
}
const structured = compile('lib/structured-data.ts', {'@/lib/site-url': {absoluteUrl: path => new URL(path, 'https://misterstory.in/').href}});
const Breadcrumbs = compile('components/Breadcrumbs.tsx', {'next/link': {__esModule: true, default: ({children, ...props}) => React.createElement('a', props, children)}});
const JsonLd = compile('components/JsonLd.tsx');
const Component = compile('components/DirectoryBreadcrumbs.tsx', {
  '@/components/Breadcrumbs': Breadcrumbs,
  '@/components/JsonLd': JsonLd,
  '@/lib/structured-data': structured,
  '@/lib/directory-pagination': compile('lib/directory-pagination.ts'),
}).default;

function check(props, expectedNames, expectedFinal) {
  const html = renderToStaticMarkup(React.createElement(Component, props));
  const scripts = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)];
  assert.equal(scripts.length, 1);
  assert.equal((html.match(/aria-label="Breadcrumb"/g) || []).length, 1);
  const schema = JSON.parse(scripts[0][1]);
  assert.equal(schema['@type'], 'BreadcrumbList');
  assert.deepEqual(schema.itemListElement.map(item => item.name), expectedNames);
  assert.deepEqual(schema.itemListElement.map(item => item.position), expectedNames.map((_, i) => i + 1));
  assert.equal(schema.itemListElement.at(-1).item, `https://misterstory.in${expectedFinal}`);
  assert.match(html, /href="\/"/);
  assert.match(html, /aria-current="page"/);
  assert.equal((html.match(/<li /g) || []).length, expectedNames.length);
  assert.doesNotMatch(html, /<h1|<meta|useEffect/);
  return html;
}

for (const label of ['Articles', 'Companies', 'People', 'Authors']) {
  test(`${label} has exactly one matching two-item visible and structured breadcrumb`, () => {
    check({label, path: `/${label.toLowerCase()}`}, ['Home', label], `/${label.toLowerCase()}`);
    assert.match(read(`app/${label.toLowerCase()}/page.tsx`), new RegExp(`breadcrumb=\\{<DirectoryBreadcrumbs label="${label}"`));
  });
}
test('paginated and filtered directories retain their canonical query and base-directory parent', () => {
  const pagination = {page: 2, query: {category: 'Funding News'}};
  const html = check({label: 'Articles', path: '/articles', pagination}, ['Home', 'Articles', 'Page 2'], '/articles?category=Funding+News&page=2');
  assert.match(html, /href="\/articles"/);
  check({label: 'Articles', path: '/articles', pagination: {page: 1, query: {q: 'Fintech'}}}, ['Home', 'Articles'], '/articles?q=Fintech');
});
test('Data adds only its missing schema, preserving its existing visible trail and catalogue', () => {
  const source = read('app/data/page.tsx');
  assert.equal((source.match(/<Breadcrumbs /g) || []).length, 1);
  assert.equal((source.match(/data=\{breadcrumbJsonLd\(/g) || []).length, 1);
  assert.match(source, /name:'Home',path:'\/'\},\{name:'Data',path:'\/data'/);
  assert.match(source, /<JsonLd data=\{catalog\}/);
});
test('breadcrumbs are server-rendered once, outside reorderable CMS sections', () => {
  const source = read('components/DirectoryPageLayout.tsx');
  assert.match(source, /\{breadcrumb\}\{settings.sections.map/);
  assert.doesNotMatch(read('components/DirectoryBreadcrumbs.tsx'), /["']use client["']/);
});
