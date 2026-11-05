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
const { default: Fund } = await import(
  pathToFileURL(process.cwd() + '/src/components/MedicalAidFund.tsx')
);
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), method: init.method || 'GET' });
  return Response.json({
    success: true,
    data: {
      total_raised: 12,
      total_spent: 24,
      completed_ops: 3,
      donor_requests: 4,
      weekly_donors: 0,
    },
  });
};
const root = createRoot(document.getElementById('root'));
await act(async () => {
  root.render(React.createElement(Fund, { presentation: 'india' }));
  await new Promise((r) => setTimeout(r, 50));
});
assert.ok(document.body.textContent.includes('Current Essentials'));
assert.ok(
  document.body.textContent.includes('12+'),
  'Show the server-provided book count',
);
const book = [...document.querySelectorAll('button')].find((b) =>
  b.textContent.includes('GET THE BOOK'),
);
assert.ok(book);
await act(async () => book.click());
assert.ok(
  document.body.textContent.includes('STUDENT ACCESS'),
  'Existing purchase tiers remain available',
);
assert.ok(document.body.textContent.includes('Complete digital edition'));
assert.equal(
  calls.filter((c) => c.method !== 'GET').length,
  0,
  'Opening purchase options must not initiate a payment',
);
await act(async () => root.unmount());
const second = createRoot(document.getElementById('root'));
await act(async () =>
  second.render(React.createElement(Fund, { presentation: 'india' })),
);
const sponsor = [...document.querySelectorAll('button')].find((b) =>
  b.textContent.includes('Request a sponsored copy'),
);
assert.ok(sponsor);
await act(async () => sponsor.click());
assert.ok(
  document.querySelector('form'),
  'Existing sponsored-copy form remains available',
);
assert.ok(document.body.textContent.includes('SUBMIT SPONSORED COPY REQUEST'));
assert.equal(
  calls.filter((c) => c.method !== 'GET').length,
  0,
  'Opening a sponsored-copy form must not submit it',
);
await act(async () => second.unmount());
dom.window.close();
console.log(
  'PASS India book flow: live figures, purchase options and sponsored-copy form without unintended writes.',
);
