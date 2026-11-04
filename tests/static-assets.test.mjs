import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assetURLs, prune, publish, verifyAsset } from '../deploy/static-assets.mjs';

test('publishes both builds, retains active assets, and expires only retired files', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'bloodnet-assets-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const first = path.join(root, 'first'), second = path.join(root, 'second'), archive = path.join(root, 'archive');
  for (const [dir, version] of [[first, 'first'], [second, 'second']]) {
    fs.mkdirSync(path.join(dir, 'chunks', '[id]'), { recursive: true });
    fs.writeFileSync(path.join(dir, version + '.css'), '/* ' + version + ' */');
    fs.writeFileSync(path.join(dir, 'chunks', '[id]', version + '.js'), '// ' + version);
  }
  publish(first, archive);
  publish(second, archive);
  assert.equal(fs.readFileSync(path.join(archive, 'first.css'), 'utf8'), '/* first */');
  assert.equal(fs.readFileSync(path.join(archive, 'second.css'), 'utf8'), '/* second */');
  assert.equal(prune(second, archive), 0);
  assert.equal(prune(second, archive, Date.now() + 31 * 86400000), 2);
  assert.ok(fs.existsSync(path.join(archive, 'second.css')));
  assert.ok(!fs.existsSync(path.join(archive, 'first.css')));
  fs.writeFileSync(path.join(second, 'second.css'), 'different content');
  assert.throws(() => publish(second, archive), /Immutable asset changed/);
  assert.equal(fs.readFileSync(path.join(archive, 'second.css'), 'utf8'), '/* second */');
});

test('smoke checks reject HTML masquerading as CSS and deduplicate versioned references', () => {
  assert.deepEqual(assetURLs('<link href="/_next/static/css/a.css?dpl=one&amp;x=1"><link href="/_next/static/css/a.css?dpl=one&amp;x=1"><script src="/_next/static/b.js">'), [
    '/_next/static/css/a.css?dpl=one&x=1', '/_next/static/b.js',
  ]);
  assert.throws(() => verifyAsset({ status: 200, type: 'text/html', body: Buffer.from('<html>') }, 'a.css'), /expected type/);
  assert.throws(() => verifyAsset({ status: 404, type: 'text/plain', body: Buffer.from('missing') }, 'a.js'), /expected type/);
  assert.doesNotThrow(() => verifyAsset({ status: 200, type: 'text/css; charset=UTF-8', body: Buffer.from('body{}') }, 'a.css'));
});
