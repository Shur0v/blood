import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const load = createRequire(path.resolve('package.json')),
  { JSDOM } = load('jsdom');
const dom = new JSDOM(
  '<!doctype html><html><body><div id="root"></div></body></html>',
  { url: 'http://localhost', pretendToBeVisual: true },
);
for (const key of [
  'window',
  'document',
  'HTMLElement',
  'Element',
  'SVGElement',
  'Node',
  'Event',
  'MouseEvent',
  'MutationObserver',
])
  globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', {
  value: dom.window.navigator,
  configurable: true,
});
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(
  dom.window,
);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(
  dom.window,
);
window.matchMedia = () => ({
  matches: false,
  addListener() {},
  removeListener() {},
  addEventListener() {},
  removeEventListener() {},
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.IntersectionObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};
const { default: React, act } = await import(
  pathToFileURL(process.cwd() + '/node_modules/react/index.js')
);
globalThis.React = React;
const { createRoot } = await import(
  pathToFileURL(process.cwd() + '/node_modules/react-dom/client.js')
);

const {default:Editor}=await import(pathToFileURL(process.cwd()+'/src/components/india/local/IndiaLocalEditor.tsx'));
const {INDIA_AREAS,IndiaCommandSchema}=await import(pathToFileURL(process.cwd()+'/src/lib/indiaLocal.ts'));
const calls=[];let records=[];
window.confirm=()=>true;globalThis.confirm=()=>true;
globalThis.fetch=async(url,init={})=>{if(init.method==='PUT'){const payload=JSON.parse(init.body),parsed=IndiaCommandSchema.safeParse(payload);calls.push(payload);if(!parsed.success)return Response.json({success:false,message:parsed.error.issues[0].message},{status:400});const row={area_id:payload.areaId,draft:payload.config,published:payload.action==='publish',live:payload.action==='publish'?payload.config:null};records=[...records.filter(r=>r.area_id!==row.area_id),row];return Response.json({success:true,data:row});}return Response.json({success:true,data:{records,areas:INDIA_AREAS}});};
const root=createRoot(document.getElementById('root'));
await act(async()=>root.render(React.createElement(Editor)));
await act(async()=>{const details=document.querySelector('#editor-india-local');details.open=true;details.dispatchEvent(new Event('toggle',{bubbles:true}));});
assert.ok(document.body.textContent.includes('India local defaults'));
await act(async()=>{const select=document.querySelector('select');select.value='chennai';select.dispatchEvent(new Event('change',{bubbles:true}));});
assert.equal([...document.querySelectorAll('label')].filter(label=>label.textContent.startsWith('Position ')).length,9,'Nine stable reserved slots');
assert.ok(document.querySelector('a[href="/india/preview/chennai"]'),'Preview stays on the protected route');
await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Start from reviewed geographic context').click());
await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Save draft').click());
assert.equal(calls.at(-1).action,'draft');assert.equal(calls.at(-1).areaId,'chennai');assert.equal(calls.at(-1).config.editorialNote,INDIA_AREAS.find(a=>a.id==='chennai').context);
await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Publish reviewed page').click());
assert.equal(calls.at(-1).action,'publish');
await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Withdraw').click());assert.equal(calls.at(-1).action,'withdraw');
await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Restore defaults').click());assert.equal(calls.at(-1).action,'restore');
await act(async()=>root.unmount());dom.window.close();console.log('PASS India local editor: curated selection, fixed recipe, private draft, preview link, publication, withdrawal and restore.');
