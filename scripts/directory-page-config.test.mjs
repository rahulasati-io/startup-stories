import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DIRECTORY_PAGES, DIRECTORY_PAGE_DEFAULTS, resolveDirectorySettings} from '../lib/directory-page-config.ts';

test('all four directories retain their current content with no CMS settings', () => {
  for (const kind of DIRECTORY_PAGES) {
    const settings = resolveDirectorySettings(kind, null);
    assert.equal(settings.title, DIRECTORY_PAGE_DEFAULTS[kind].title);
    assert.deepEqual(settings.sections.map(section => section.kind), ['directory', 'newsletter']);
  }
});
test('blank H1 and SEO fields cannot erase essential page text', () => {
  const value = resolveDirectorySettings('people', {title:'  ', seoTitle:'', seoDescription:null});
  assert.equal(value.title, DIRECTORY_PAGE_DEFAULTS.people.title);
  assert.equal(value.seoDescription, DIRECTORY_PAGE_DEFAULTS.people.seoDescription);
});
test('main directory remains visible even if hidden or omitted through API data', () => {
  assert.equal(resolveDirectorySettings('articles', {sections:[]}).sections[0].kind, 'directory');
  assert.equal(resolveDirectorySettings('articles', {sections:[{_key:'main', kind:'directory', enabled:false}]}).sections.length, 1);
});
test('duplicate directory blocks are removed so the page retains one H1', () => {
  const value = resolveDirectorySettings('companies', {sections:[{_key:'a', kind:'directory'}, {_key:'b', kind:'directory'}]});
  assert.equal(value.sections.filter(section => section.kind === 'directory').length, 1);
});
test('custom order, hidden sections and deliberately blank introduction are respected', () => {
  const sections = [{_key:'intro', kind:'text'}, {_key:'main', kind:'directory'}, {_key:'signup', kind:'newsletter', enabled:false}];
  const value = resolveDirectorySettings('authors', {sections, description:''});
  assert.deepEqual(value.sections.map(section => section._key), ['intro', 'main']);
  assert.equal(value.description, '');
  assert.equal(sections.length, 3);
});
