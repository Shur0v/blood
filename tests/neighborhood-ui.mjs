import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React, act } = await import('react');
globalThis.React = React;
const { createRoot } = await import('react-dom/client');
const { default: Editor } = await import('../src/components/NeighborhoodEditor.tsx');
const calls = [];
let neighborhood = null;
const selected = { token: 'signed-fixture', city: 'Dhaka', country: 'Bangladesh', registrationArea: { name: 'South Badda', placeId: 'bloodnet:bd:dhaka:south-badda' } };
globalThis.fetch = async (url, init = {}) => {
  assert.equal(init.headers['x-bloodnet-profile'], 'owner');
  calls.push({ url: String(url), method: init.method || 'GET', body: init.body });
  if (init.method === 'PATCH') neighborhood = JSON.parse(init.body).clear ? null : selected.registrationArea.name;
  return Response.json({ success: true, data: { city: 'Dhaka', country: 'Bangladesh', neighborhood, enabled: true, suggestions: String(url).includes('?') ? [selected] : [] } });
};
const root = createRoot(document.getElementById('root'));
const button = name => [...document.querySelectorAll('button')].find(item => item.textContent === name);
const click = async name => { assert.ok(button(name), name); await act(async () => button(name).click()); };
const type = async text => {
  const input = document.querySelector('input');
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => new Promise(resolve => setTimeout(resolve, 450)));
};
try {
  await act(async () => root.render(React.createElement(Editor, { userId: 'owner', revision: '1' })));
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 0);
  await click('Edit neighborhood');
  await type('Badda dha');
  const input = document.querySelector('[role=combobox]');
  assert.equal(document.querySelectorAll('[role=option]').length, 1);
  await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true })));
  await act(async () => input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })));
  assert.equal(input.value, 'South Badda, Dhaka, Bangladesh');
  await click('Save');
  assert.ok(document.body.textContent.includes('South Badda, Dhaka, Bangladesh'));
  assert.deepEqual(JSON.parse(calls.find(call => call.method === 'PATCH').body), { token: 'signed-fixture' });
  await click('Edit neighborhood');
  await type('Gulshan');
  await click('Cancel');
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 1);
  await click('Edit neighborhood');
  await click('Clear neighborhood');
  assert.equal(neighborhood, null);
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 2);
  assert.ok(document.body.textContent.includes('Neighborhood cleared.'));
  console.log('PASS neighborhood editor keyboard selection, explicit Save, Cancel and Clear, and account identity headers.');
} finally { await act(async () => root.unmount()); dom.window.close(); }
