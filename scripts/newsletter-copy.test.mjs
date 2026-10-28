import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {DEFAULT_HOME_SECTIONS} from '../lib/homepage-config.ts';
import {DEFAULT_DIRECTORY_SECTIONS} from '../lib/directory-page-config.ts';

const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../components/Newsletter.tsx', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true}}).outputText;
const module = {exports: {}};
new Function('require', 'module', 'exports', compiled)(name => name === 'next/link' ? {__esModule: true, default: props => React.createElement('a', props)} : require(name), module, module.exports);
const render = props => renderToStaticMarkup(React.createElement(module.exports.default, props));
const heading = 'Get MisterStory in your inbox';
const description = 'Subscribe for business stories, company analysis and funding updates.';

for (const compact of [false, true]) {
  test(`default ${compact ? 'sidebar' : 'full'} newsletter clearly refers to email with no publishing-frequency promise`, () => {
    const html = render({compact});
    assert.ok(html.includes(heading));
    assert.ok(html.includes(description));
    assert.doesNotMatch(html, /every week|weekly|one business story/i);
    assert.match(html, /type="email"/);
    assert.match(html, />Subscribe<\/button>/);
  });
}
test('legacy Sanity section copy is replaced in rendered HTML without a CMS write', () => {
  for (const text of ['Interesting companies, smart strategies and the numbers behind them.', 'One clear company story in your inbox every week.']) {
    const html = render({title: 'One business story every week.', description: text});
    assert.ok(html.includes(heading));
    assert.ok(html.includes(description));
    assert.doesNotMatch(html, /every week/);
  }
});
test('custom titles, descriptions, buttons and intentionally blank fields remain editable', () => {
  const html = render({title: 'Our research by email', description: 'A monthly editorial digest.', buttonLabel: 'Join us'});
  assert.match(html, /Our research by email/);
  assert.match(html, /A monthly editorial digest\./);
  assert.match(html, />Join us<\/button>/);
  const blank = render({title: '', description: ''});
  assert.ok(!blank.includes(heading));
  assert.ok(!blank.includes(description));
});
test('homepage and directory defaults use the same approved newsletter copy', () => {
  for (const sections of [DEFAULT_HOME_SECTIONS, DEFAULT_DIRECTORY_SECTIONS]) {
    const newsletter = sections.find(section => section.kind === 'newsletter');
    assert.equal(newsletter.title, heading);
    assert.equal(newsletter.description, description);
  }
});
test('subscription endpoint and consent links are preserved', () => {
  assert.match(source, /fetch\("\/api\/newsletter"/);
  const html = render({});
  assert.match(html, /href="\/privacy"/);
  assert.match(html, /You can unsubscribe at any time/);
});
