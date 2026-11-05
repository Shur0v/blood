import { before, after, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { randomBytes, randomUUID } from 'node:crypto';
import { Client } from 'pg';
import { getPrisma } from '../src/backend/config/db';
import { getLocationSettings, saveLocationSettings } from '../src/backend/services/locationSettings';
import { signToken } from '../src/backend/utils/jwt';
import { staffCredentialVersion } from '../src/backend/utils/staffCredential';
import { signLocationProof, verifyLocationProof } from '../src/backend/utils/locationProof';
import { assertLocationPolicy } from '../src/backend/services/locationPolicy';
import { GET, PATCH } from '../src/app/api/admin/location-settings/route';
import { GET as signup } from '../src/app/api/location/signup/route';
import { POST as addCity } from '../src/app/api/users/me/service-cities/route';

const databaseUrl = process.env.TEST_LOCATION_DATABASE_URL;
const integration = { skip: !databaseUrl };
const adminId = randomUUID(), managerId = randomUUID(), userId = randomUUID();
const headers = (id = adminId, role: 'ADMIN' | 'MANAGER' | 'USER' = 'ADMIN') => ({ Authorization: 'Bearer ' + signToken({ user_id: id, role, ...(role !== 'USER' ? { credential_version: staffCredentialVersion(id, 'test-password') } : {}) }), 'Content-Type': 'application/json', 'x-real-ip': '127.0.0.1' });
let sql: Client;

before(async () => {
  if (!databaseUrl) return;
  const url = new URL(databaseUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname));
  assert.match(url.pathname, /^\/bloodnet_location_test_\d+$/);
  Object.assign(process.env, { NODE_ENV: 'test', DATABASE_URL: databaseUrl, JWT_SECRET: randomBytes(32).toString('hex'), GEOAPIFY_API_KEY: 'synthetic-only' });
  delete process.env.NEIGHBORHOODS_ENABLED;
  delete process.env.SIGNUP_NEIGHBORHOODS_ENABLED;
  sql = new Client({ connectionString: databaseUrl });
  await sql.connect();
  assert.equal((await sql.query("SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n, 0);
  for (const folder of fs.readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await sql.query(fs.readFileSync('prisma/migrations/' + folder.name + '/migration.sql', 'utf8'));
  }
  for (const [id, role] of [[adminId, 'ADMIN'], [managerId, 'MANAGER']]) await getPrisma().adminUser.create({ data: { id, admin_id: id, password: 'test-password', role } });
  await getPrisma().user.create({ data: { id: userId, profile_code: 'L0C1', name: 'Synthetic location test', email: 'location@example.invalid', mobile: '+8801700009999', blood_group: 'A+', location_city: 'Dhaka', location_country: 'Bangladesh', location_lat: 23.8, location_lng: 90.4 } });
});

after(async () => { if (sql) { await getPrisma().$disconnect(); await sql.end(); } });

test('settings persist, administrators control them, and optimistic revisions reject stale edits', integration, async () => {
  const simultaneousReads = await Promise.all(Array.from({ length: 12 }, () => getLocationSettings()));
  const initial = simultaneousReads[0];
  assert.ok(simultaneousReads.every(settings => settings.revision === 1 && settings.detail === 'detailed'));
  assert.equal(await getPrisma().locationSettings.count(), 1);
  assert.equal(initial.detail, 'detailed');
  assert.equal(initial.scope, 'country');
  process.env.NEIGHBORHOODS_ENABLED = 'false';
  assert.equal((await getLocationSettings()).detail, 'detailed', 'Environment changes do not override persisted settings');
  delete process.env.NEIGHBORHOODS_ENABLED;
  assert.equal((await GET(new Request('http://localhost/api/admin/location-settings'))).status, 401);
  assert.equal((await GET(new Request('http://localhost/api/admin/location-settings', { headers: headers(managerId, 'MANAGER') }))).status, 403);
  const { revision, ...settings } = initial;
  const change = () => PATCH(new Request('http://localhost/api/admin/location-settings', { method: 'PATCH', headers: headers(), body: JSON.stringify({ settings: { ...settings, countryInLabel: true }, revision }) }));
  assert.equal((await change()).status, 200);
  assert.equal((await change()).status, 409);
  assert.equal((await getLocationSettings()).countryInLabel, true);
  assert.equal((await getLocationSettings()).revision, revision + 1);
});

test('district-only queries require detection and signed choices cannot bypass the active policy', integration, async () => {
  const current = await getLocationSettings();
  const { revision, ...settings } = current;
  const saved = await saveLocationSettings({ ...settings, scope: 'district' }, revision);
  const empty = await signup(new Request('http://localhost/api/location/signup?text=gabtoli', { headers: { 'x-country-code': 'BD', 'x-real-ip': '127.0.0.1' } }));
  assert.equal((await empty.json()).meta.requiresLocation, true);
  const cumilla = { city: 'Cumilla', country: 'Bangladesh', country_code: 'bd', state: 'Chattogram Division', county: 'Cumilla District', result_type: 'city', place_id: 'cumilla', lat: 23.46, lon: 91.18 };
  const dhaka = { ...cumilla, city: 'Dhaka', state: 'Dhaka Division', county: 'Dhaka District', place_id: 'dhaka', lat: 23.8, lon: 90.4 };
  const provider = mock.method(globalThis, 'fetch', async input => {
    const url = new URL(String(input));
    if (url.pathname.endsWith('/reverse')) return Response.json({ results: [cumilla] });
    if (url.searchParams.get('type') === 'city') return Response.json({ results: url.searchParams.get('text')!.startsWith('Cumilla') ? [cumilla] : [dhaka] });
    return Response.json({ results: [cumilla, dhaka].map(parent => ({ ...parent, result_type: 'suburb', name: 'Gabtoli', place_id: parent.place_id + '-gabtoli' })) });
  });
  try {
    const query = 'http://localhost/api/location/signup?text=gabtoli&browserLat=23.46&browserLng=91.18&browserCountry=Bangladesh';
    const response = await signup(new Request(query, { headers: { ...headers(userId, 'USER'), 'x-country-code': 'BD' } }));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.ok(body.data.length);
    assert.ok(body.data.every((item: any) => item.city === 'Cumilla'));
    const selection = body.data.find((item: any) => item.registrationArea);
    const proof = verifyLocationProof(selection.token)!;
    await assertLocationPolicy(new Request(query, { headers: headers(userId, 'USER') }), proof);
    const saveRequest = (payload: unknown) => new Request('http://localhost/api/users/me/service-cities', { method: 'POST', headers: headers(userId, 'USER'), body: JSON.stringify(payload) });
    assert.equal((await addCity(saveRequest({ ...selection, city: 'Dhaka' }))).status, 400);
    assert.equal((await addCity(saveRequest(selection))).status, 200);
    const row = await getPrisma().userServiceCity.findFirstOrThrow({ where: { user_id: userId } });
    assert.equal(row.city, 'Cumilla');
    assert.equal(row.neighborhood_name, 'Gabtoli');
    assert.ok(row.locked_until.getTime() > Date.now());
    const changed = await saveLocationSettings({ ...settings, scope: 'country', detail: 'cities' }, saved.revision);
    await assert.rejects(assertLocationPolicy(new Request(query), proof), /settings changed/);
    await assert.rejects(assertLocationPolicy(new Request(query), { ...proof, policyRevision: changed.revision }), /Choose a city/);
    await assert.rejects(assertLocationPolicy(new Request(query), { ...proof, policyRevision: undefined }), /Choose a city/);
    const foreign = await signup(new Request(query.replace('gabtoli', 'Delhi%20India'), { headers: { 'x-country-code': 'BD' } }));
    assert.ok((await foreign.json()).data.every((item: any) => !item.registrationArea));
  } finally { provider.mock.restore(); }
});
