import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost', pretendToBeVisual: true });
for (const key of ['window', 'document', 'HTMLElement', 'Element', 'SVGElement', 'Node', 'Event', 'MouseEvent', 'KeyboardEvent', 'MutationObserver', 'screen']) globalThis[key] = dom.window[key];
Object.defineProperty(globalThis, 'navigator', { value: dom.window.navigator, configurable: true });
globalThis.getComputedStyle = dom.window.getComputedStyle.bind(dom.window);
globalThis.requestAnimationFrame = dom.window.requestAnimationFrame.bind(dom.window);
globalThis.cancelAnimationFrame = dom.window.cancelAnimationFrame.bind(dom.window);
window.matchMedia = () => ({ matches: false, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {} });
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const { default: React, act } = await import('react');
globalThis.React = React;
const { createRoot } = await import('react-dom/client');
const { default: Auth } = await import('../src/components/AuthModal.tsx');
const { default: Dashboard } = await import('../src/components/UnifiedDashboard.tsx');
const root = createRoot(document.getElementById('root'));
const city = { city: 'Dhaka', country: 'Bangladesh', formatted_location: 'Dhaka, Bangladesh', latitude: 23.8, longitude: 90.4, provider_place_id: 'dhaka', token: 'signed-city' };
const south = { ...city, token: 'signed-south', registrationArea: { name: 'South Badda', placeId: 'south' } };
const merul = { ...city, token: 'signed-merul', registrationArea: { name: 'Merul Badda', placeId: 'merul' } };
const agrabad = { ...city, city: 'Chattogram', formatted_location: 'Chattogram, Bangladesh', provider_place_id: 'chattogram', token: 'signed-agrabad', registrationArea: { name: 'Agrabad', placeId: 'agrabad' } };
let serviceCities = [{ id: 'primary', city: 'Dhaka', country: 'Bangladesh', formatted_location: 'Dhaka, Bangladesh', canRemove: false, remainingDays: 30, registrationArea: merul.registrationArea }];
const calls = [];
globalThis.fetch = async (input, init = {}) => {
  const url = new URL(String(input), 'http://localhost');
  calls.push({ path: url.pathname, text: url.searchParams.get('text'), country: url.searchParams.get('country'), method: init.method || 'GET', body: init.body });
  if (url.pathname === '/api/location/ip') return Response.json({ success: true, data: { country: 'Bangladesh', city: 'Dhaka', lat: 23.8, lng: 90.4 } });
  if (url.pathname === '/api/location/signup' && url.searchParams.get('text') === 'missing' && !url.searchParams.get('country')) return Response.json({ success: true, data: [], meta: { requiresCountry: true, message: 'Choose your country.' } });
  if (url.pathname === '/api/location/signup') return Response.json({ success: true, data: url.searchParams.get('text').toLowerCase().includes('agr') ? [agrabad] : [south, merul, city], meta: { country: 'Bangladesh' } });
  if (url.pathname === '/api/users/me/neighborhood') return Response.json({ success: true, data: { city: 'Dhaka', country: 'Bangladesh', neighborhood: serviceCities[0].registrationArea?.name, enabled: true, suggestions: [] } });
  if (url.pathname === '/api/users/me/service-cities/primary' && init.method === 'PATCH') {
    assert.deepEqual(JSON.parse(init.body), { token: 'signed-south' });
    assert.equal(init.headers['x-bloodnet-profile'], 'owner');
    serviceCities = [{ ...serviceCities[0], registrationArea: south.registrationArea }];
    return Response.json({ success: true, data: serviceCities });
  }
  if (url.pathname === '/api/users/me/service-cities' && init.method === 'POST') {
    assert.equal(JSON.parse(init.body).registrationArea.name, 'Agrabad');
    serviceCities = [...serviceCities, { ...agrabad, id: 'second', remainingDays: 30, canRemove: false }];
    return Response.json({ success: true, data: serviceCities });
  }
  return Response.json({ success: true, data: [] });
};
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function type(input, text) {
  await act(async () => {
    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set.call(input, text);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await act(async () => wait(550));
}
async function clickText(text) {
  const button = [...document.querySelectorAll('button')].find(button => button.textContent.includes(text));
  assert.ok(button, text);
  await act(async () => button.click());
}
try {
  await act(async () => root.render(React.createElement(Auth, { isOpen: true, onClose() {}, onSuccess() {} })));
  const input = document.getElementById('auth-city');
  assert.ok(input);
  assert.ok(input.closest('[role="dialog"]'));
  await type(input, 'ba');
  assert.equal(calls.filter(call => call.path === '/api/location/signup').length, 0);
  await type(input, 'bad');
  assert.ok(document.body.textContent.includes('South Badda'));
  assert.ok(document.body.textContent.includes('Merul Badda'));
  await clickText('Merul Badda');
  await type(input, 'agr');
  await clickText('Agrabad');
  assert.ok(document.body.textContent.includes('Selected 2/5 cities'));
  assert.ok(document.body.textContent.includes('Merul Badda, Dhaka, Bangladesh'));
  assert.ok(document.body.textContent.includes('Agrabad, Chattogram, Bangladesh'));
  await type(input, 'missing');
  const countrySelect = document.querySelector('select');
  assert.ok(countrySelect);
  await act(async () => { countrySelect.value = 'in'; countrySelect.dispatchEvent(new Event('change', { bubbles: true })); });
  await act(async () => wait(550));
  assert.ok(calls.some(call => call.text === 'missing' && call.country === 'in'));
  console.log('PASS signup uses three-character lookup, saves primary/additional area choices, and offers a country selector when needed.');
  await act(async () => root.render(React.createElement(Dashboard, { profile: { id: 'owner', name: 'Fixture', city: 'Dhaka', country: 'Bangladesh', bloodGroup: 'A+', verificationStatus: 'UNVERIFIED', serviceCities }, isReady: true, onToggleReady() {} })));
  const serviceInput = [...document.querySelectorAll('input')].find(input => input.getAttribute('placeholder') === 'Search a city or area (3+ characters)...');
  assert.ok(serviceInput, JSON.stringify([...document.querySelectorAll('input')].map(input => input.getAttribute('placeholder'))));
  assert.ok(serviceInput.closest('[data-analytics-private]'));
  await type(serviceInput, 'bad');
  await clickText('South Badda, Dhaka');
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 0);
  assert.ok(document.body.textContent.includes('Update Dhaka to South Badda?'));
  await clickText('Update neighborhood');
  assert.equal(calls.filter(call => call.method === 'PATCH').length, 1);
  assert.equal(serviceCities[0].remainingDays, 30);
  await type(serviceInput, 'agr');
  await clickText('Agrabad, Chattogram');
  assert.equal(calls.filter(call => call.method === 'POST').length, 1);
  assert.equal(serviceCities.length, 2);
  console.log('PASS profile confirms existing-city neighborhood changes and adds new cities with their area.');
  const { default: useLocationSuggestions } = await import('../src/components/useLocationSuggestions.ts');
  let resolveOld;
  globalThis.fetch = async input => {
    const url = new URL(String(input), 'http://localhost');
    if (url.searchParams.get('text') === 'old') return new Promise(resolve => { resolveOld = resolve; });
    return Response.json({ success: true, data: [agrabad], meta: {} });
  };
  function Probe() {
    const [text, setText] = React.useState('');
    const lookup = useLocationSuggestions(text);
    return React.createElement('div', {}, React.createElement('input', { value: text, onChange: event => setText(event.target.value) }),
      React.createElement('p', {}, lookup.suggestions.map(row => row.registrationArea?.name).join(',')));
  }
  await act(async () => root.render(React.createElement(Probe)));
  const probe = document.querySelector('input');
  await type(probe, 'old');
  assert.ok(resolveOld);
  await type(probe, 'new');
  await act(async () => resolveOld(Response.json({ success: true, data: [south], meta: {} })));
  assert.ok(document.body.textContent.includes('Agrabad'));
  assert.ok(!document.body.textContent.includes('South Badda'));
  console.log('PASS delayed results from a previous query cannot replace the latest suggestions.');
} finally { await act(async () => root.unmount()); dom.window.close(); }
