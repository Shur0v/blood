import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const prefix = '/_next/static/';
const retentionMs = 30 * 24 * 60 * 60 * 1000;
const assetName = /^(?:[A-Za-z0-9_.\[\]()-]+\/)*[A-Za-z0-9_.\[\]()-]+$/;

function safeName(name) {
  return assetName.test(name) && !name.split('/').some(part => part.startsWith('.'));
}

function filesUnder(root, relative = '') {
  const files = [];
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const name = relative ? relative + '/' + entry.name : entry.name;
    if (!safeName(name)) throw Error('Unexpected static asset path: ' + name);
    if (entry.isDirectory()) files.push(...filesUnder(root, name));
    else if (entry.isFile()) files.push(name);
    else throw Error('Static assets must not contain links or special files: ' + name);
  }
  return files;
}

function directory(dir, create = false) {
  if (create) fs.mkdirSync(dir, { recursive: true, mode: 0o755 });
  if (!fs.lstatSync(dir).isDirectory() || fs.realpathSync(dir) !== path.resolve(dir)) {
    throw Error('Static asset directory must not be a symlink: ' + dir);
  }
}

export function publish(source, archive) {
  directory(source);
  directory(archive, true);
  const assets = filesUnder(source);
  if (!assets.some(name => name.endsWith('.css')) || !assets.some(name => name.endsWith('.js'))) {
    throw Error('Static build is incomplete: expected CSS and JavaScript.');
  }
  for (const name of assets) {
    const from = path.join(source, name), to = path.join(archive, name);
    directory(path.dirname(to), true);
    const bytes = fs.readFileSync(from);
    try {
      const existing = fs.lstatSync(to);
      if (!existing.isFile() || !fs.readFileSync(to).equals(bytes)) throw Error('Immutable asset changed at ' + name);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const temporary = to + '.pending-' + randomUUID();
      try {
        fs.writeFileSync(temporary, bytes, { flag: 'wx', mode: 0o644 });
        fs.chmodSync(temporary, 0o644);
        fs.renameSync(temporary, to);
      } finally {
        fs.rmSync(temporary, { force: true });
      }
    }
    const now = new Date();
    fs.utimesSync(to, now, now);
  }
  return assets;
}

export function prune(source, archive, now = Date.now()) {
  directory(source);
  directory(archive);
  const active = new Set(filesUnder(source));
  if (!active.size) throw Error('Cannot prune without an active build.');
  let count = 0;
  for (const name of filesUnder(archive)) {
    const file = path.join(archive, name);
    if (!active.has(name) && fs.statSync(file).mtimeMs < now - retentionMs) {
      fs.unlinkSync(file);
      count++;
    }
  }
  return count;
}

export function assetURLs(html) {
  return [...new Set([...html.matchAll(/\b(?:href|src)="(\/_next\/static\/[^"<>]+)"/g)]
    .map(match => match[1].replaceAll('&amp;', '&')))];
}

export function verifyAsset(response, name) {
  const type = response.type.split(';')[0].trim();
  const expected = name.endsWith('.css') ? /^text\/css$/ :
    /\.m?js$/.test(name) ? /^(?:application|text)\/javascript$/ :
    name.endsWith('.woff2') ? /^font\/woff2$/ : name.endsWith('.woff') ? /^font\/woff$/ : null;
  if (response.status !== 200 || !response.body.length || type === 'text/html' || (expected && !expected.test(type))) {
    throw Error('Static asset did not load with its expected type: ' + name + ' (' + response.status + ', ' + type + ')');
  }
}

function originRequest(url) {
  const base = process.env.BLOODNET_ASSET_CHECK_ORIGIN || 'https://bloodnet.live';
  const target = new URL(url, base);
  const port = target.port || (target.protocol === 'https:' ? '443' : '80');
  const output = execFileSync('curl', ['--silent', '--show-error', '--max-time', '10', '--noproxy', '*', '--globoff',
    '--resolve', target.hostname + ':' + port + ':127.0.0.1', '--write-out', '\n%{http_code}\n%{content_type}\n%header{cache-control}', target.href],
    { maxBuffer: 32 * 1024 * 1024 });
  const cache = output.lastIndexOf(10), end = output.lastIndexOf(10, cache - 1), start = output.lastIndexOf(10, end - 1);
  return { status: Number(output.subarray(start + 1, end)), type: output.subarray(end + 1, cache).toString(), body: output.subarray(0, start), cache: output.subarray(cache + 1).toString() };
}

export function verifyOrigin(archive) {
  directory(archive, true);
  const name = 'bloodnet-probe-' + randomUUID() + '.css';
  const body = '/* BloodNet origin probe */\n';
  const file = path.join(archive, name);
  fs.writeFileSync(file, body, { flag: 'wx', mode: 0o644 });
  try {
    fs.chmodSync(file, 0o644);
    const response = originRequest(prefix + name);
    verifyAsset(response, name);
    if (response.body.toString() !== body || !response.cache.includes('immutable')) throw Error('Nginx did not serve the archived probe with immutable caching.');
  } finally {
    fs.unlinkSync(file);
  }
  const missing = originRequest(prefix + name + '.missing.css');
  if (missing.status !== 404 || !missing.type.startsWith('text/plain') || !missing.cache.includes('no-store')) {
    throw Error('A missing static asset must return a plain, non-cacheable 404.');
  }
}

export async function verifyRelease(appUrl = 'http://127.0.0.1:3000/') {
  const homepage = await fetch(appUrl, { redirect: 'error', signal: AbortSignal.timeout(15000) });
  if (!homepage.ok) throw Error('Cannot verify static assets: homepage returned ' + homepage.status);
  const urls = assetURLs(await homepage.text());
  if (!urls.some(url => new URL(url, 'http://local').pathname.endsWith('.css'))) throw Error('No homepage stylesheets found.');
  for (const url of urls) {
    const name = decodeURIComponent(new URL(url, 'http://local').pathname.slice(prefix.length));
    if (!safeName(name)) throw Error('Unexpected homepage asset URL.');
    verifyAsset(originRequest(url), name);
  }
  console.log('Verified ' + urls.length + ' homepage assets through Nginx.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  process.umask(0o022);
  const [action, source = '.next/static'] = process.argv.slice(2);
  const archive = path.resolve('/var/lib/bloodnet-static/_next/static');
  if (action === 'publish') console.log('Published ' + publish(path.resolve(source), archive).length + ' static assets.');
  else if (action === 'prune') console.log('Pruned ' + prune(path.resolve(source), archive) + ' expired static assets.');
  else if (action === 'probe') verifyOrigin(archive);
  else if (action === 'verify') await verifyRelease();
  else throw Error('Use publish, prune, probe, or verify.');
}
