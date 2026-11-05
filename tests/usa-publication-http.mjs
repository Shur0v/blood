// Requires the guarded, synthetic USA preview fixture. Never runs against production.
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {USA_AREAS} from '../src/lib/usaEdition.ts';
const base=process.env.BLOODNET_PREVIEW_URL||'http://127.0.0.1:3105';
assert.ok(['127.0.0.1','localhost'].includes(new URL(base).hostname));
for(const alias of ['/usa','/united-states']){
 const response=await fetch(base+alias,{redirect:'manual'});
 assert.ok([301,308].includes(response.status));assert.equal(new URL(response.headers.get('location'),base).pathname,'/us');
}
for(const route of ['/us',...USA_AREAS.map(area=>area.path)]){
 const response=await fetch(base+route);assert.equal(response.status,200,route);
 const doc=new JSDOM(await response.text()).window.document;
 assert.equal(new URL(doc.querySelector('link[rel="canonical"]').href).pathname,route);
 assert.equal(doc.querySelectorAll('h1').length,1);assert.ok(!doc.querySelector('meta[name="robots"]')?.content.includes('noindex'));
 assert.ok(doc.querySelector('script[type="application/ld+json"]'));
 if(route!=='/us'){
   assert.match(doc.title,/Blood Donor Directory/);
   assert.match(doc.querySelector('h1').textContent,/Blood donor connections/);
   assert.ok(doc.body.textContent.includes('Can registering in'));
   assert.ok(doc.querySelector('a[href="https://www.fda.gov/consumers/consumer-updates/have-you-given-blood-lately"]'));
 }
}
assert.equal((await fetch(base+'/us/preview/las-vegas')).status,404);
assert.equal((await fetch(base+'/us/cities/not-a-reviewed-area')).status,404);
assert.equal((await fetch(base+'/api/admin/us-content')).status,401);
const sitemap=await (await fetch(base+'/sitemap-regions.xml')).text();
for(const area of USA_AREAS)assert.ok(sitemap.includes(area.path),area.path);
assert.ok(!sitemap.includes('/preview/'));
console.log('PASS USA permanent aliases, 15 canonical public pages, structured data, publication sitemap and protected preview/editor access.');
