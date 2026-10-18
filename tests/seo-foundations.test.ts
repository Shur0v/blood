import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalAliasUrl } from '../src/lib/canonicalOrigin';
import robots from '../src/app/robots';
import { PRIVATE_CRAWL_PATHS, SEARCH_CRAWLERS } from '../src/lib/crawlerPolicy';
import { renderUrlSetXml } from '../src/lib/sitemapXml';
import { buildDatasetSchema } from '../src/lib/aiSeo';
import { indexNowUrls } from '../src/lib/indexNow';

test('www redirects preserve path, escaped data and query without trusting arbitrary hosts', () => {
  const destination = canonicalAliasUrl('http://www.bloodnet.live/guides/find-blood-donors-near-you?ref=a%26b', 'www.bloodnet.live', 'https://bloodnet.live');
  assert.equal(destination?.href, 'https://bloodnet.live/guides/find-blood-donors-near-you?ref=a%26b');
  assert.equal(canonicalAliasUrl('http://localhost:3000/guides?ref=a%26b', 'www.bloodnet.live', 'https://bloodnet.live')?.href, 'https://bloodnet.live/guides?ref=a%26b');
  for (const host of ['bloodnet.live', 'bloodnet.live.evil.test', 'localhost:3224', 'www.bloodnet.live.evil.test']) {
    assert.equal(canonicalAliasUrl('http://'+host+'/blood', host, 'https://bloodnet.live'), null);
  }
  assert.equal(canonicalAliasUrl('http://localhost:3224/', 'localhost:3224', 'https://bloodnet.live'), null);
  assert.equal(canonicalAliasUrl('https://www.bloodnet.live/', 'www.bloodnet.live', 'broken'), null);
});

test('each explicit search crawler retains every private exclusion', () => {
  const groups = robots().rules;
  assert.ok(Array.isArray(groups));
  for (const crawler of ['*', ...SEARCH_CRAWLERS]) {
    const group = groups.find(rule => rule.userAgent === crawler);
    assert.ok(group, crawler);
    assert.equal(group.allow, '/');
    assert.deepEqual(group.disallow, PRIVATE_CRAWL_PATHS);
    assert.ok(group.disallow.includes('/api'));
    assert.ok(group.disallow.includes('/profile'));
    assert.ok(!group.disallow.includes('/register'), 'Public /register-donor must remain crawlable');
  }
});

test('sitemap URLs escape XML and omit invented modification dates', async () => {
  const xml = await renderUrlSetXml([{ url:'https://bloodnet.live/guides?type=blood&lang=en' }]).text();
  assert.ok(xml.includes('type=blood&amp;lang=en'));
  assert.ok(!xml.includes('<lastmod>'));
  assert.equal(buildDatasetSchema().url.endsWith('/network'), true);
});

test('IndexNow deduplicates public URLs and rejects private data, foreign hosts and previews', () => {
  assert.deepEqual(indexNowUrls('https://bloodnet.live', ['/guides', '/guides']), ['https://bloodnet.live/guides']);
  for (const value of ['/api/users/me', '/%61pi/users/me', '/profile', '/admin-dashboard', '/guides?donorExplore=1', 'https://other.example/guides', '//other.example/guides']) {
    assert.throws(() => indexNowUrls('https://bloodnet.live', [value]));
  }
  assert.throws(() => indexNowUrls('https://bloodnet.live', []));
});
