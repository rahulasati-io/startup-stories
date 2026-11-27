import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
import {spawnSync} from 'node:child_process';

const require = createRequire(import.meta.url);
const readJson = name => JSON.parse(fs.readFileSync(new URL('../' + name, import.meta.url), 'utf8'));
const pkg = readJson('package.json');
const lock = readJson('package-lock.json');

test('Next and lint pins use the reviewed patched release and installed lockfile', () => {
  assert.equal(pkg.dependencies.next, '16.4.6');
  assert.equal(pkg.devDependencies['eslint-config-next'], pkg.dependencies.next);
  for (const name of ['next', 'eslint-config-next']) {
    assert.equal(lock.packages['node_modules/' + name].version, '16.4.6');
    assert.equal(readJson('node_modules/' + name + '/package.json').version, '16.4.6');
  }
  assert.equal(pkg.dependencies.sanity, pkg.dependencies['@sanity/vision']);
  assert.equal(pkg.dependencies.sanity, '6.24.0');
  assert.equal(lock.packages['node_modules/sanity'].version, pkg.dependencies.sanity);
});

test('local and build Node requirements cover the CLI helper without changing major version', () => {
  const semver = require('semver');
  const selected = fs.readFileSync(new URL('../.nvmrc', import.meta.url), 'utf8').trim();
  assert.equal(selected, '22.23.5');
  for (const range of [pkg.engines.node, lock.packages['node_modules/sanity'].engines.node,
    lock.packages['node_modules/skills'].engines.node]) {
    assert.ok(semver.satisfies(selected, range), `${selected} meets ${range}`);
  }
  assert.ok(semver.satisfies(process.versions.node, pkg.engines.node), 'run checks with the supported Node runtime');
  assert.equal(semver.satisfies('22.13.1', pkg.engines.node), false);
  assert.equal(semver.satisfies('24.0.0', pkg.engines.node), false);
});

test('React and React DOM satisfy the installed Studio editor and framework peer requirements', () => {
  const semver = require('semver');
  assert.equal(pkg.dependencies.react, '19.3.1');
  assert.equal(pkg.dependencies['react-dom'], pkg.dependencies.react);
  for (const name of ['react', 'react-dom']) {
    assert.equal(require(name + '/package.json').version, pkg.dependencies.react);
    assert.equal(lock.packages['node_modules/' + name].version, pkg.dependencies.react);
  }
  for (const [name, dependency] of Object.entries(lock.packages)) {
    if (name.endsWith('node_modules/@portabletext/editor') || name === 'node_modules/next') {
      const range = dependency.peerDependencies?.react;
      assert.ok(range, `${name} declares a React peer`);
      assert.ok(semver.satisfies(pkg.dependencies.react, range), `${name} requires ${range}`);
    }
  }
});

const frameworkRequire = createRequire(require.resolve('@vercel/frameworks'));
const parserEntry = frameworkRequire.resolve('smol-toml');

test('framework tooling resolves the targeted patched parser and retains TOML semantics', () => {
  assert.deepEqual(pkg.overrides, {'smol-toml': '1.9.1'});
  const parserVersions = Object.entries(lock.packages)
    .filter(([name]) => name.endsWith('/node_modules/smol-toml') || name === 'node_modules/smol-toml');
  assert.ok(parserVersions.length > 0);
  for (const [path, installed] of parserVersions) assert.equal(installed.version, '1.9.1', path);
  const {parse} = frameworkRequire('smol-toml');
  const config = parse('name = "misterstory"\n[build]\ncommand = "npm run build"\nflags = [true, false]\n');
  assert.equal(config.name, 'misterstory');
  assert.equal(config.build.command, 'npm run build');
  assert.deepEqual(config.build.flags, [true, false]);
  assert.equal(Object.getPrototypeOf(config), null, 'patched parser returns safe dictionary objects');
});

test('malformed TOML rejects promptly instead of hanging the CLI process', () => {
  // Isolated, bounded local regression for GHSA-7w5x-hrqm-74c2, never a network test.
  const result = spawnSync(process.execPath, ['-e', `
    const {parse} = require(${JSON.stringify(parserEntry)});
    try { parse('a=[1 #'); process.exitCode = 1; }
    catch { process.exitCode = 0; }
  `], {timeout: 5000, encoding: 'utf8', windowsHide: true});
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
