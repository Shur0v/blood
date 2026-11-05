import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
Object.defineProperty(navigator, 'geolocation', { value: { getCurrentPosition(_success, failure) { failure({ code: 1 }); } } });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React, act } = await import('react');
globalThis.React = React;
const { createRoot } = await import('react-dom/client');
const { default: Page } = await import('../src/app/private/console-0be5626d4305f192e37e/workspace/location-management/page.tsx');
let saved = { detail: 'detailed', scope: 'country', nearbyFirst: true, typoSuggestions: true, countryInLabel: false, revision: 1 };
let conflict = false;
const choices = Array.from({ length: 50 }, (_, index) => ({ city: 'Gabtoli', district: 'District ' + index, country: 'Bangladesh', formatted_location: 'Gabtoli, Bangladesh', latitude: 23 + index * .01, longitude: 90, provider_place_id: 'gabtoli-' + index, selectionId: 'gabtoli-' + index, token: 'synthetic' }));
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://localhost');
  if (url.pathname === '/api/location/ip') return Response.json({ success: true, data: { country: 'Bangladesh' } });
  if (url.pathname.endsWith('/location-settings')) {
    if (init.method === 'PATCH') {
      const body = JSON.parse(init.body);
      assert.equal(body.revision, saved.revision);
      if (conflict) return Response.json({ success: false, message: 'Another administrator changed these settings. Reload before saving.' }, { status: 409 });
      saved = { ...body.settings, revision: saved.revision + 1 };
    }
    return Response.json({ success: true, data: saved });
  }
  if (url.pathname === '/api/location/signup') return Response.json({ success: true, data: saved.scope === 'district' ? [] : choices, meta: { settings: saved, requiresLocation: saved.scope === 'district', message: saved.scope === 'district' ? 'Confirm your current location.' : '' } });
  throw new Error('Unexpected UI request ' + url.pathname);
};

const root = createRoot(document.getElementById('root'));
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const click = async text => {
  const button = [...document.querySelectorAll('button')].find(item => item.textContent.includes(text));
  assert.ok(button, text);
  await act(async () => button.click());
};
const change = async (element, value) => {
  await act(async () => {
    const prototype = element.tagName === 'SELECT' ? window.HTMLSelectElement.prototype : window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(prototype, 'value').set.call(element, value);
    element.dispatchEvent(new Event(element.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true }));
  });
  await act(async () => wait(500));
};
try {
  await act(async () => root.render(React.createElement(Page)));
  assert.equal(document.querySelector('[aria-label="Selection detail"]').value, 'detailed');
  assert.equal(document.querySelector('[aria-label="Geographic scope"]').value, 'country');
  await change(document.getElementById('location-preview'), 'gab');
  assert.equal(document.querySelectorAll('li').length, 20);
  await click('Show more matches');
  assert.equal(document.querySelectorAll('li').length, 40);
  await click('Show more matches');
  assert.equal(document.querySelectorAll('li').length, 50);
  assert.ok(document.body.textContent.includes('District 49'));
  assert.ok(!document.body.textContent.includes('Show more matches'));
  await change(document.querySelector('[aria-label="Geographic scope"]'), 'district');
  await click('Save settings');
  await act(async () => wait(550));
  assert.equal(saved.scope, 'district');
  assert.equal(document.querySelectorAll('li').length, 0);
  await click('Confirm my current location');
  assert.ok(document.body.textContent.includes('Location permission was not granted'));
  await click('Restore defaults');
  assert.equal(saved.scope, 'district', 'Reset requires explicit saving');
  await click('Save settings');
  await act(async () => wait(550));
  assert.equal(saved.scope, 'country');
  conflict = true;
  await click('Save settings');
  assert.ok(document.body.textContent.includes('Another administrator changed'));
  console.log('PASS Location Management defaults, fifty-result scrolling, saved district policy, denied GPS, reset and save conflict.');
} finally { await act(async () => root.unmount()); dom.window.close(); }
