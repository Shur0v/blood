import assert from 'node:assert/strict';
import { get as httpGet } from 'node:http';

const base = process.env.SEO_TEST_BASE_URL;
if (!base || !['127.0.0.1', 'localhost'].includes(new URL(base).hostname)) throw new Error('Set SEO_TEST_BASE_URL to an isolated local production server.');
const read = async path => { const response = await fetch(base+path); assert.equal(response.status, 200, path); return { response, text:await response.text() }; };
const home = await read('/');
const homeMarkup = home.text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
for (const content of ['Every Drop', 'How it Works', 'A trusted network.', 'Frequently asked', 'Privacy Policy (Full)', '/guides/protect-medical-records', 'Search donation guides']) assert.ok(homeMarkup.includes(content), `Initial HTML missing ${content}`);
assert.equal(home.response.headers.get('x-powered-by'), null);
assert.match(home.text, /<html[^>]+lang="en"/);
assert.ok(!home.response.headers.get('x-robots-tag')?.includes('noindex'));
const scripts = [...home.text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].flatMap(match => JSON.parse(match[1]));
assert.ok(scripts.some(item => item['@type'] === 'Organization'));
assert.ok(!scripts.some(item => item['@type'] === 'FAQPage'), 'Homepage must not claim invisible regional FAQs');
const blood = await read('/blood'); assert.match(blood.text, /rel="canonical" href="https:\/\/bloodnet.live\/blood"/);
const guide = await read('/guides/find-blood-donors-near-you'); assert.ok(guide.text.includes('Article')); assert.ok(guide.text.includes('BreadcrumbList'));
const robots = await read('/robots.txt');
for (const bot of ['OAI-SearchBot', 'Claude-SearchBot', 'PerplexityBot']) assert.ok(robots.text.includes('User-Agent: '+bot));
const icon = await fetch(base+'/apple-touch-icon.png'); assert.equal(icon.status,200); assert.match(icon.headers.get('content-type'), /image\/png/);
const preview = await read('/guides/find-blood-donors-near-you?donorExplore=1'); assert.match(preview.response.headers.get('x-robots-tag'), /noindex/);
const denied = await fetch(base+'/api/users/me/profile'); assert.equal(denied.status,401); assert.match(denied.headers.get('x-robots-tag'), /noindex/);
// Raw HTTP retains the proxy Host header; fetch may replace it with the URL host.
const alias = await new Promise((resolve,reject) => {
  const request = httpGet(base+'/guides/find-blood-donors-near-you?ref=qa', {headers:{Host:'www.bloodnet.live'}}, response => {
    resolve({status:response.statusCode, location:response.headers.location}); response.resume();
  });
  request.setTimeout(15000, () => request.destroy(new Error('Canonical redirect check timed out.')));
  request.on('error',reject);
});
assert.equal(alias.status,301); assert.equal(alias.location,'https://bloodnet.live/guides/find-blood-donors-near-you?ref=qa');
for (const map of ['/sitemap.xml', '/sitemap-main.xml', '/sitemap-categories.xml', '/sitemap-guides.xml']) {
  const {text} = await read(map);
  for (const unwanted of ['/privacy-policy<', '/blood-donation-guide<', '/organ-donation-guide<', '/policy.txt<']) assert.ok(!text.includes(unwanted), map+': '+unwanted);
  const urls = [...text.matchAll(/<loc>(.*?)<\/loc>/g)].map(match=>match[1]); assert.equal(new Set(urls).size,urls.length,map+' duplicates');
}
console.log('Production HTTP SEO checks passed: initial content, metadata, JSON-LD, canonical redirect, crawler rules, icons, sitemaps, preview and private API protection.');
