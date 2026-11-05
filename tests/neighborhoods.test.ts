import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { lookupNeighborhoods, matchesLocationQuery, neighborhoodsEnabled } from '../src/backend/services/neighborhoods';
import { signLocationProof, verifyLocationProof } from '../src/backend/utils/locationProof';
import { GET as signupLookup } from '../src/app/api/location/signup/route';
import { GET as neighborhoodGet, PATCH as neighborhoodPatch } from '../src/app/api/users/me/neighborhood/route';
import { signToken } from '../src/backend/utils/jwt';

Object.assign(process.env, { NODE_ENV: 'test', JWT_SECRET: randomBytes(32).toString('hex') });

test('reviewed areas survive provider outages, accept screenshot queries, and retain city-only selection', async () => {
  const key = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'fixture-only';
  const provider = mock.method(globalThis, 'fetch', async () => { throw new Error('provider unavailable'); });
  try {
    for (const [query, area] of [
      ['Badda dha', 'Badda'], ['banasree, dh', 'Banasree'], ['south-Badda', 'South Badda'],
      ['west-Rampura', 'West Rampura'], ['Gulshan', 'Gulshan'], ['Mohakhali', 'Mohakhali'],
    ]) {
      const rows = await lookupNeighborhoods(query);
      assert.equal(rows[0].registrationArea?.name, area);
      assert.equal(rows[0].city, 'Dhaka');
      assert.equal(rows[0].country, 'Bangladesh');
      assert.equal(rows[0].latitude, 23.8103);
      assert.match(rows[0].registrationArea!.placeId, /^bloodnet:/);
      assert.ok(rows.some(row => !row.registrationArea && row.city === 'Dhaka'));
      assert.deepEqual(verifyLocationProof(signLocationProof(rows[0]))?.registrationArea, rows[0].registrationArea);
    }
    assert.deepEqual(await lookupNeighborhoods('Gulshan', { city: 'Lahore', country: 'Pakistan' }), []);
    assert.deepEqual(await lookupNeighborhoods('Gulshan, Dhaka, Pakistan'), []);
  } finally {
    provider.mock.restore();
    if (key === undefined) delete process.env.GEOAPIFY_API_KEY; else process.env.GEOAPIFY_API_KEY = key;
  }
});

test('worldwide areas require confirmed parents and use parent city coordinates', async () => {
  const prior = process.env.GEOAPIFY_API_KEY;
  process.env.GEOAPIFY_API_KEY = 'international-fixture';
  const fixtures = [
    ['Bandra', 'Mumbai', 'India', 'in'], ['Gulberg', 'Lahore', 'Pakistan', 'pk'],
    ['Thamel', 'Kathmandu', 'Nepal', 'np'], ['Shinjuku', 'Tokyo', 'Japan', 'jp'],
    ['Brooklyn', 'New York', 'United States', 'us'], ['মোহাম্মদপুর', 'ঢাকা', 'বাংলাদেশ', 'bd'],
  ];
  let parentAvailable = true;
  const provider = mock.method(globalThis, 'fetch', async (input: URL | string | Request) => {
    const url = new URL(String(input));
    assert.equal(url.hostname, 'api.geoapify.com');
    const text = url.searchParams.get('text') || '';
    const fixture = fixtures.find(([area, city]) => text.startsWith(area) || text.startsWith(city))!;
    const [area, city, country, code] = fixture;
    const parent = { city, country, country_code: code, state: 'Verified state', place_id: 'city-' + code, result_type: 'city', lat: 20, lon: 30 };
    if (url.searchParams.get('type') === 'city') return Response.json({ results: parentAvailable ? [parent] : [] });
    return Response.json({ results: [
      { ...parent, name: area, place_id: 'area-' + code, result_type: 'suburb', lat: 21, lon: 31 },
      { ...parent, name: area, place_id: 'building', result_type: 'building' },
      { ...parent, name: area, place_id: 'street', result_type: 'suburb', street: 'Private road' },
    ] });
  });
  try {
    for (const [area, city, country] of fixtures) {
      const rows = await lookupNeighborhoods(area);
      assert.equal(rows[0].registrationArea?.name, area);
      assert.equal(rows[0].city, city);
      assert.equal(rows[0].country, country === 'বাংলাদেশ' ? 'Bangladesh' : country);
      assert.equal(rows[0].latitude, 20);
      assert.equal(rows[0].longitude, 30);
      assert.equal(rows.length, 2);
      assert.deepEqual(await lookupNeighborhoods(area, { city: 'Other', country }), []);
    }
    parentAvailable = false;
    assert.deepEqual(await lookupNeighborhoods('Bandra'), []);
  } finally {
    provider.mock.restore();
    if (prior === undefined) delete process.env.GEOAPIFY_API_KEY; else process.env.GEOAPIFY_API_KEY = prior;
  }
});

test('explicit contexts and duplicate names remain distinguishable', () => {
  const base = { city: 'Dhaka', country: 'Bangladesh', latitude: 0, longitude: 0, provider_place_id: 'city', formatted_location: 'Dhaka, Bangladesh', registrationArea: { name: 'Badda', placeId: 'area' } };
  assert.equal(matchesLocationQuery(base, 'badda, dh'), true);
  assert.equal(matchesLocationQuery({ ...base, city: 'Dhaka', country: 'Pakistan' }, 'badda, dhaka, bangladesh'), false);
  assert.equal(matchesLocationQuery({ ...base, city: 'Badda', registrationArea: { name: 'Dhaka', placeId: 'other' } }, 'badda, dhaka'), false);
});

test('shared flag overrides the legacy flag, including signup behavior', async () => {
  const modern = process.env.NEIGHBORHOODS_ENABLED, legacy = process.env.SIGNUP_NEIGHBORHOODS_ENABLED, key = process.env.GEOAPIFY_API_KEY;
  delete process.env.GEOAPIFY_API_KEY;
  process.env.SIGNUP_NEIGHBORHOODS_ENABLED = 'true';
  delete process.env.NEIGHBORHOODS_ENABLED;
  try {
    assert.equal(neighborhoodsEnabled(), true);
    assert.ok((await (await signupLookup(new Request('http://localhost/api/location/signup?text=Gulshan', { headers: { 'x-country-code': 'BD' } }))).json()).data[0].registrationArea);
    process.env.NEIGHBORHOODS_ENABLED = 'false';
    assert.equal(neighborhoodsEnabled(), false);
    assert.ok((await (await signupLookup(new Request('http://localhost/api/location/signup?text=Dhaka', { headers: { 'x-country-code': 'BD' } }))).json()).data.every((row: any) => !row.registrationArea));
  } finally {
    for (const [name, value] of Object.entries({ NEIGHBORHOODS_ENABLED: modern, SIGNUP_NEIGHBORHOODS_ENABLED: legacy, GEOAPIFY_API_KEY: key })) {
      if (value === undefined) delete process.env[name]; else process.env[name] = value;
    }
  }
});

test('private neighborhood endpoints reject anonymous and staff callers before accessing data', async () => {
  for (const method of [neighborhoodGet, neighborhoodPatch]) {
    assert.equal((await method(new Request('http://localhost/api/users/me/neighborhood'))).status, 401);
    for (const role of ['ADMIN', 'MANAGER']) {
      const token = signToken({ user_id: 'fixture', role });
      assert.equal((await method(new Request('http://localhost/api/users/me/neighborhood', { headers: { Authorization: 'Bearer ' + token } }))).status, 403);
    }
  }
});
