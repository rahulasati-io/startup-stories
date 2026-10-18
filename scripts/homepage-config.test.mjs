import assert from 'node:assert/strict';
import {test} from 'node:test';
import {DEFAULT_HOME_SECTIONS, homepageSections, homepageHref} from '../lib/homepage-config.ts';

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
test('latest stories excludes funding and default section keys are unique', () => {
  assert.equal(DEFAULT_HOME_SECTIONS.find(s => s._key === 'latest').excludeFunding, true);
  assert.equal(new Set(DEFAULT_HOME_SECTIONS.map(s => s._key)).size, DEFAULT_HOME_SECTIONS.length);
});
