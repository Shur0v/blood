import nextEnv from '@next/env';
import { getIndexNowKey, indexNowUrls } from '../../lib/indexNow';

nextEnv.loadEnvConfig(process.cwd(), false);
const key = getIndexNowKey();
if (!key) throw new Error('Set INDEXNOW_KEY to an 8–128 character public verification key before submitting.');
const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://bloodnet.live';
const origin = new URL(base);
if (origin.protocol !== 'https:') throw new Error('Use the deployed HTTPS canonical origin.');
const urlList = indexNowUrls(base, process.argv.slice(2));
const keyLocation = origin.origin + '/indexnow-key.txt';
const verification = await fetch(keyLocation, { signal: AbortSignal.timeout(15000), redirect: 'error' });
if (!verification.ok || (await verification.text()).trim() !== key) throw new Error('Deploy the verification key route before submitting URLs.');
const response = await fetch('https://api.indexnow.org/indexnow', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ host: origin.hostname, key, keyLocation, urlList }),
  signal: AbortSignal.timeout(20000),
});
if (![200, 202].includes(response.status)) throw new Error(`IndexNow returned HTTP ${response.status}; submission was not confirmed.`);
console.log(`IndexNow accepted ${urlList.length} public URL notification(s), HTTP ${response.status}. Indexing is decided by each search engine.`);
