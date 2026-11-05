import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { searchLocations, matchesLocationQuery } from '../src/backend/services/neighborhoods';
import { districtIdentity } from '../src/backend/services/locationDistrict';
import { locationLabel, locationContextLabel } from '../src/lib/locationSettings';
import { GET as signup } from '../src/app/api/location/signup/route';
import { GET as adminSettings } from '../src/app/api/admin/location-settings/route';

Object.assign(process.env, { NODE_ENV: 'test', GEOAPIFY_API_KEY: 'synthetic-provider', JWT_SECRET: randomBytes(32).toString('hex') });
delete process.env.DATABASE_URL;
delete process.env.NEIGHBORHOODS_ENABLED;
delete process.env.SIGNUP_NEIGHBORHOODS_ENABLED;

const dhaka = { city: 'Dhaka', country: 'Bangladesh', country_code: 'bd', county: 'Dhaka District', state: 'Dhaka Division', place_id: 'dhaka', result_type: 'city', lat: 23.81, lon: 90.41 };

test('countrywide expansion retains fifty same-name places and nearby order without a twenty-result cut', async () => {
  const places = Array.from({ length: 50 }, (_, index) => ({ ...dhaka, city: 'Gabtoli', county: 'District ' + index, place_id: 'gabtoli-' + index, lat: 23.8 + index * .01 }));
  const calls: URL[] = [];
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input)); calls.push(url);
    return Response.json({ results: url.pathname.endsWith('/search') ? places : places.slice(0, 20) });
  });
  try {
    const result = await searchLocations('gabtoli', { country: 'Bangladesh', countryCode: 'bd', bias: { lat: 23.8, lng: 90.41 } });
    assert.equal(result.data.length, 50);
    assert.equal(new Set(result.data.map(row => row.selectionId)).size, 50);
    assert.equal(result.data[0].provider_place_id, 'gabtoli-0');
    assert.equal(result.data[49].provider_place_id, 'gabtoli-49');
    assert.ok(calls.some(url => !url.searchParams.has('bias')));
    assert.ok(calls.every(url => url.searchParams.get('filter') === 'countrycode:bd'));
  } finally { provider.mock.restore(); }
});

test('a failed national expansion reports partial coverage instead of silently presenting nearby-only matches', async () => {
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    return url.searchParams.has('bias') ? Response.json({ results: [{ ...dhaka, city: 'Gabtoli', place_id: 'nearby-only' }] }) : new Response('', { status: 503 });
  });
  try {
    const result = await searchLocations('gabtoli', { country: 'Bangladesh', countryCode: 'bd', bias: { lat: 23.8, lng: 90.4 } });
    assert.ok(result.data.some(row => row.provider_place_id === 'nearby-only'));
    assert.equal(result.limited, true);
  } finally { provider.mock.restore(); }
});

test('Dhanmondi spelling corrections survive normalization and keep parent coordinates', async () => {
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    return Response.json({ results: url.searchParams.get('type') === 'city' ? [dhaka] : [{ ...dhaka, name: 'Dhanmondi', result_type: 'suburb', place_id: 'dhanmondi', lat: 23.746, lon: 90.377 }] });
  });
  try {
    for (const query of ['dhanmondi', 'DHANMONDI', 'dhanmodni', 'dhanmondi, dhaka']) {
      const result = await searchLocations(query, { country: 'Bangladesh', countryCode: 'bd' });
      const area = result.data.find(row => row.registrationArea?.placeId === 'dhanmondi');
      assert.ok(area, query);
      assert.equal(area.city, 'Dhaka');
      assert.equal(area.latitude, dhaka.lat);
      assert.equal(area.corrected, query === 'dhanmodni');
    }
    const strict = await searchLocations('dhanmodni', { country: 'Bangladesh', countryCode: 'bd', typoSuggestions: false });
    assert.ok(!strict.data.some(row => row.registrationArea?.placeId === 'dhanmondi'));
  } finally { provider.mock.restore(); }
});

test('missing city hierarchy uses a verified reverse parent instead of discarding the locality', async () => {
  const { city, ...withoutCity } = dhaka;
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    return Response.json({ results: url.pathname.endsWith('/reverse') ? [dhaka] : [{ ...withoutCity, name: 'Dhanmondi', result_type: 'suburb', place_id: 'area-no-city' }] });
  });
  try {
    const result = await searchLocations('dhanmondi', { country: 'Bangladesh', countryCode: 'bd' });
    assert.ok(result.data.some(row => row.registrationArea?.placeId === 'area-no-city' && row.city === 'Dhaka'));
  } finally { provider.mock.restore(); }
});

test('provider-backed native-script aliases remain selectable alongside English labels', async () => {
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    return Response.json({ results: url.searchParams.get('type') === 'city' ? [dhaka] : [{ ...dhaka, name: 'Dhanmondi', result_type: 'suburb', place_id: 'native-name', datasource: { raw: { 'name:bn': 'ধানমন্ডি', 'name:en': 'Dhanmondi' } } }] });
  });
  try {
    const result = await searchLocations('ধানম', { country: 'Bangladesh', countryCode: 'bd' });
    assert.ok(result.data.some(row => row.registrationArea?.placeId === 'native-name'));
    assert.ok(result.data.every(row => !('searchNames' in row) && !('providerConfidence' in row)));
  } finally { provider.mock.restore(); }
});

test('an area field is retained when the provider main name repeats its parent city', async () => {
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    return Response.json({ results: url.searchParams.get('type') === 'city' ? [dhaka] : [{ ...dhaka, name: 'Dhaka', suburb: 'Dhanmondi', result_type: 'suburb', place_id: 'suburb-field' }] });
  });
  try {
    const result = await searchLocations('dhanmondi', { country: 'Bangladesh', countryCode: 'bd' });
    assert.ok(result.data.some(row => row.registrationArea?.name === 'Dhanmondi'));
  } finally { provider.mock.restore(); }
});

test('same-name areas across districts survive and district filtering uses administrative identity', async () => {
  const cumilla = { ...dhaka, city: 'Cumilla', county: 'Cumilla District', state: 'Chattogram Division', place_id: 'cumilla', lat: 23.46, lon: 91.18 };
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    if (url.searchParams.get('type') === 'city') return Response.json({ results: url.searchParams.get('text')!.startsWith('Cumilla') ? [cumilla] : [dhaka] });
    return Response.json({ results: [dhaka, cumilla].map(parent => ({ ...parent, name: 'Gabtoli', result_type: 'suburb', place_id: parent.place_id + '-gabtoli' })) });
  });
  try {
    const context = { country: 'Bangladesh', countryCode: 'bd', bias: { lat: cumilla.lat, lng: cumilla.lon } };
    const all = await searchLocations('gabtoli', context);
    assert.deepEqual(all.data.filter(row => row.registrationArea).map(row => row.city), ['Cumilla', 'Dhaka']);
    const local = await searchLocations('gabtoli', { ...context, districtKey: districtIdentity(cumilla)!.key });
    assert.ok(local.data.length);
    assert.ok(local.data.every(row => row.city === 'Cumilla'));
  } finally { provider.mock.restore(); }
});

test('labels retain country context and Unicode matching remains available', () => {
  const item = { city: 'Dhaka', country: 'Bangladesh', district: 'Dhaka District', registrationArea: { name: 'Dhanmondi' } };
  assert.equal(locationLabel(item), 'Dhanmondi, Dhaka');
  assert.equal(locationLabel(item, true), 'Dhanmondi, Dhaka, Bangladesh');
  assert.match(locationContextLabel(item), /Bangladesh/);
  assert.equal(matchesLocationQuery({ ...dhaka, formatted_location: '', latitude: 1, longitude: 2, provider_place_id: 'unicode', registrationArea: { name: 'ধানমন্ডি', placeId: 'unicode' } }, 'ধানম'), true);
  assert.equal(districtIdentity({ country_code: 'bd', city: 'Dhaka' } as any), undefined);
});

test('admin settings require authentication and default signup accepts two characters', async () => {
  assert.equal((await adminSettings(new Request('http://localhost/api/admin/location-settings'))).status, 401);
  const provider = mock.method(globalThis, 'fetch', async () => Response.json({ results: [dhaka] }));
  try {
    const response = await signup(new Request('http://localhost/api/location/signup?text=dh', { headers: { 'x-country-code': 'BD' } }));
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.meta.settings.detail, 'detailed');
    assert.equal(body.meta.settings.scope, 'country');
  } finally { provider.mock.restore(); }
});
