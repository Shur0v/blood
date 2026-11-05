// Only an isolated, synthetic preview is allowed. No publication is performed here.
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import {INDIA_AREAS,indiaDirectoryArea} from '../src/lib/indiaLocal.ts';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
const base=process.env.BLOODNET_PREVIEW_URL||'http://127.0.0.1:3106';assert.ok(['localhost','127.0.0.1'].includes(new URL(base).hostname));
const results=[];
for(const area of INDIA_AREAS){const response=await fetch(base+area.path);assert.equal(response.status,200,area.path);const doc=new JSDOM(await response.text()).window.document;assert.equal(doc.querySelectorAll('h1').length,1);assert.equal(new URL(doc.querySelector('link[rel="canonical"]').href).pathname,area.path);assert.ok(!doc.querySelector('meta[name="robots"]')?.content.includes('noindex'));assert.ok(doc.querySelector('[data-india-component="introduction"]'));const schema=[...doc.querySelectorAll('script[type="application/ld+json"]')].flatMap(s=>JSON.parse(s.textContent));assert.ok(schema.some(s=>s['@type']==='CollectionPage'));assert.ok(schema.some(s=>s['@type']==='BreadcrumbList'));results.push({route:area.path,status:200,canonical:true,structuredData:true});}
assert.equal((await fetch(base+'/india/preview/chennai')).status,404);assert.equal((await fetch(base+'/api/admin/india-content')).status,401);assert.equal((await fetch(base+'/india/cities/not-reviewed')).status,404);
const sitemap=await (await fetch(base+'/sitemap-regions.xml')).text();for(const area of INDIA_AREAS)assert.ok(sitemap.includes(area.path));assert.ok(!sitemap.includes('/preview/'));
const inventory=JSON.parse(fs.readFileSync('docs/india-local-release/existing-route-inventory.json','utf8'));
for(const url of inventory.urls){const p=new URL(url).pathname.split('/');assert.ok(['blood-donors','organ-donors'].includes(p[1]));assert.equal(p[2],'india');assert.ok(indiaDirectoryArea(p[3].replaceAll('-',' ')));}
const out=process.env.BLOODNET_PREVIEW_ARTIFACTS||path.join(os.tmpdir(),'bloodnet-india-preview');fs.writeFileSync(path.join(out,'http-verification.json'),JSON.stringify({areas:results,anonymousPreview:404,anonymousEditor:401,unknownArea:404,sitemap:true,inventoriedRoutes:inventory.urls.length},null,2));
console.log('PASS 26 published guide HTTP/canonical/schema checks, sitemap, protected preview/editor and inventoried route shapes.');
