import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { explicitLocationCountry, withoutExplicitCountry } from '../src/lib/locationCountry';
import { resolveLocationSearch } from '../src/backend/services/locationSearchContext';
import { searchLocations } from '../src/backend/services/neighborhoods';
import { GET as signup } from '../src/app/api/location/signup/route';
import { GET as cities } from '../src/app/api/location/cities/route';

Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: randomBytes(32).toString('hex'), GEOAPIFY_API_KEY: 'country-fixtures', NEIGHBORHOODS_ENABLED: 'true' });
const request = (text: string, country?: string, extra = '') => new Request('http://localhost/api/location/signup?text=' + encodeURIComponent(text) + extra, { headers: country ? { 'x-country-code': country } : {} });

test('full country names override at boundaries, while partial names and codes do not', () => {
  for (const text of ['Gujrat, India', 'gujrat INDIA', 'India, Gujrat']) {
    assert.equal(explicitLocationCountry(text)?.code, 'in');
    assert.equal(withoutExplicitCountry(text).toLowerCase(), 'gujrat');
  }
  assert.equal(explicitLocationCountry('Indian colony'), undefined);
  assert.equal(explicitLocationCountry('Gujrat ind'), undefined);
  assert.equal(explicitLocationCountry('Gujrat IN'), undefined);
  assert.equal(explicitLocationCountry('Brooklyn, United States of America')?.code, 'us');
  assert.equal(withoutExplicitCountry('Abidjan, Côte d’Ivoire'), 'abidjan');
});

test('country precedence and coordinate compatibility follow the selected country', async () => {
  assert.equal((await resolveLocationSearch(request('bad', 'BD'), 'bad', 'Nepal'))?.countryCode, 'bd');
  assert.equal((await resolveLocationSearch(request('bad India', 'BD'), 'bad India', 'Nepal'))?.countryCode, 'in');
  assert.equal((await resolveLocationSearch(request('bad'), 'bad', 'Nepal'))?.countryCode, 'np');
  assert.equal(await resolveLocationSearch(request('bad'), 'bad'), null);
  const local = await resolveLocationSearch(request('bad', 'BD', '&browserCountry=Bangladesh&browserLat=23.8&browserLng=90.4'), 'bad');
  assert.deepEqual(local?.bias, { lat: 23.8, lng: 90.4 });
  const abroad = await resolveLocationSearch(request('bad India', 'BD', '&browserCountry=Bangladesh&browserLat=23.8&browserLng=90.4'), 'bad India');
  assert.equal(abroad?.bias, undefined);
});

test('country filtering retains area variants across districts and orders similar matches by area distance', async () => {
  const parent = (city: string, lat: number) => ({ city, country: 'Bangladesh', country_code: 'bd', state: city + ' district', place_id: 'city-' + city, result_type: 'city', lat, lon: 90.4 });
  const near = parent('Near city', 23.8), far = parent('Far city', 25.8);
  const foreign = { ...near, country: 'India', country_code: 'in', city: 'Foreign', place_id: 'foreign' };
  const calls: URL[] = [];
  const provider = mock.method(globalThis, 'fetch', async (input: URL | string | Request) => {
    const url = new URL(String(input)); calls.push(url);
    assert.equal(url.searchParams.get('filter'), 'countrycode:bd');
    assert.equal(url.searchParams.get('limit'), '20');
    if (url.searchParams.get('type') === 'city') return Response.json({ results: url.searchParams.get('text')!.startsWith(near.city) ? [near] : [far] });
    return Response.json({ results: [
      { ...far, name: 'East Badda', place_id: 'far-area', result_type: 'suburb', lat: 25.9 },
      { ...near, name: 'West Badda', place_id: 'near-area', result_type: 'suburb', lat: 23.81 },
      { ...near, name: 'Merul Badda', suburb: 'Gulshan', place_id: 'merul-area', result_type: 'suburb', lat: 23.85 },
      { ...foreign, name: 'New Badda', place_id: 'wrong-country', result_type: 'suburb' },
    ] });
  });
  try {
    const context = { country: 'Bangladesh', countryCode: 'bd', bias: { lat: 23.8, lng: 90.4 } };
    const result = await searchLocations('bad', context);
    const areas = result.data.filter(row => row.registrationArea && !row.registrationArea.placeId.startsWith('bloodnet:'));
    assert.deepEqual(areas.slice(0, 3).map(row => row.registrationArea!.name), ['West Badda', 'Merul Badda', 'East Badda']);
    assert.ok(areas.some(row => row.city === 'Far city'));
    assert.equal(areas[0].latitude, near.lat);
    assert.equal('point' in areas[0], false);
    assert.equal(calls[0].searchParams.get('bias'), 'proximity:90.4,23.8');
    const narrow = await searchLocations('badda, Far city', context);
    assert.ok(narrow.data.every(row => row.city === 'Far city'));
  } finally { provider.mock.restore(); }
});

test('country overrides filter provider calls and fail closed on empty results and outages', async () => {
  const provider = mock.method(globalThis, 'fetch', async (input: URL | string | Request) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('filter'), 'countrycode:in');
    return Response.json({ results: [{ city: 'Gujrat', country: 'India', country_code: 'in', place_id: 'city-in', result_type: 'city', lat: 22, lon: 73 }] });
  });
  try {
    const body = await (await signup(request('Gujrat, India', 'BD'))).json();
    assert.equal(body.meta.country, 'India');
    assert.equal(body.data[0].country, 'India');
  } finally { provider.mock.restore(); }
  const offline = mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  try {
    const foreign = await (await signup(request('Delhi', 'BD'))).json();
    assert.deepEqual(foreign.data, []);
    assert.match(foreign.meta.message, /unavailable/);
    const missing = await (await signup(request('bad'))).json();
    assert.equal(missing.meta.requiresCountry, true);
    const selected = await (await signup(request('bad', undefined, '&country=BD'))).json();
    assert.ok(selected.data.every((row: any) => row.country === 'Bangladesh'));
    assert.ok(selected.data.some((row: any) => row.registrationArea?.name === 'South Badda'));
    process.env.NEIGHBORHOODS_ENABLED = 'false';
    const cityOnly = await (await cities(request('Delhi', 'BD'))).json();
    assert.deepEqual(cityOnly.data, []);
    assert.equal((await signup(request('ba', 'BD'))).status, 400);
  } finally { offline.mock.restore(); process.env.NEIGHBORHOODS_ENABLED = 'true'; }
});

test('parent verification is bounded to eight contexts and reports a truncated countrywide list', async () => {
  const parents = Array.from({ length: 9 }, (_, index) => ({ city: 'City ' + index, country: 'Nepal', country_code: 'np', state: 'State ' + index, place_id: 'city-' + index, result_type: 'city', lat: 27 + index * .01, lon: 85 }));
  let active = 0, peak = 0;
  const provider = mock.method(globalThis, 'fetch', async (input: URL | string | Request) => {
    const url = new URL(String(input));
    assert.equal(url.searchParams.get('filter'), 'countrycode:np');
    if (url.searchParams.get('type') !== 'city') return Response.json({ results: parents.map((parent, index) => ({ ...parent, name: 'Central quarter ' + index, result_type: 'suburb', place_id: 'area-' + index })) });
    active++; peak = Math.max(peak, active);
    await new Promise(resolve => setTimeout(resolve, 5));
    active--;
    return Response.json({ results: parents.filter(row => url.searchParams.get('text')!.startsWith(row.city)) });
  });
  try {
    const result = await searchLocations('central', { country: 'Nepal', countryCode: 'np' });
    assert.equal(result.data.filter(row => row.registrationArea).length, 8);
    assert.ok(peak <= 3);
    assert.equal(result.limited, true);
  } finally { provider.mock.restore(); }
});

test('lookup failures return a safe retry response without leaking server configuration', async () => {
  const secret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  const offline = mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  try {
    const response = await signup(request('Dhaka', 'BD'));
    assert.equal(response.status, 503);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.match((await response.json()).message, /temporarily unavailable/);
  } finally { offline.mock.restore(); process.env.JWT_SECRET = secret; }
});

test('identically named cities keep distinct verified parent references', async () => {
  const { sameLocationParent } = await import('../src/lib/locationCountry');
  const base = { city: 'Springfield', country: 'United States', provider_place_id: 'verified-state-one-city' };
  assert.equal(sameLocationParent(base, { ...base }), true);
  assert.equal(sameLocationParent(base, { ...base, provider_place_id: 'verified-state-two-city' }), false);
  assert.equal(sameLocationParent(base, { ...base, provider_place_id: undefined }), true);
  assert.equal(sameLocationParent(base, { ...base, provider_place_id: 'fallback-springfield-united-states' }), true);
  assert.equal(sameLocationParent(base, { ...base, country: 'Canada' }), false);
});
