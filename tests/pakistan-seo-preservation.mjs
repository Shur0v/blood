import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { JSDOM } from 'jsdom';

// Before/after HTTP captures must use the same isolated directory fixture.
const out=process.env.BLOODNET_PREVIEW_ARTIFACTS||path.join(os.tmpdir(),'bloodnet-pakistan-preview');
const routes=['/blood/lahore','/blood/a-positive/lahore','/blood-donors/pakistan/lahore','/blood-donors/pakistan/lahore/a-positive','/organ-donors/pakistan/lahore','/network/pakistan','/blood/chennai','/blood/kathmandu','/blood/dhaka'];
const previewOrigins=text=>text.replace(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+/g,'https://bloodnet.live');
const normalize=text=>previewOrigins(text).replace(/\s+/g,' ').replace(/Retrieved \d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} UTC/g,'Retrieved [snapshot time] UTC').trim();
const results=[];
for(const route of routes){
  const read=stage=>new JSDOM(fs.readFileSync(path.join(out,stage+route.replaceAll('/','_')+'.html'),'utf8')).window.document;
  const before=read('before'),after=read('after');
  for(const selector of ['title','meta[name="description"]','link[rel="canonical"]','meta[name="robots"]','meta[property="og:title"]','meta[property="og:description"]']){
    const value=doc=>{const el=doc.querySelector(selector);const value=el?.getAttribute('content')||el?.getAttribute('href')||el?.textContent||null;return value?previewOrigins(value):value;};
    assert.equal(value(after),value(before),route+' '+selector);
  }
  const schemas=doc=>[...doc.querySelectorAll('script[type="application/ld+json"]')].map(el=>JSON.parse(previewOrigins(el.textContent)));
  assert.deepEqual(schemas(after),schemas(before),route+' structured data');
  const content=doc=>{const main=doc.querySelector('main');assert.ok(main);for(const node of main.querySelectorAll('script,style'))node.remove();return normalize(main.textContent);};
  assert.equal(content(after),content(before),route+' server-rendered content');
  const links=doc=>[...doc.querySelectorAll('main a[href]')].map(el=>previewOrigins(el.getAttribute('href')));
  assert.deepEqual(links(after),links(before),route+' internal destinations');
  results.push({route,metadata:true,structuredData:true,content:true,links:true});
}
fs.writeFileSync(path.join(out,'seo-preservation.json'),JSON.stringify(results,null,2));
console.log('PASS unchanged SEO content, metadata, structured data and links for '+routes.length+' representative routes.');
