import { after, before, test } from 'node:test';
import assert from 'node:assert/strict';
import { randomBytes, randomUUID } from 'node:crypto';
import fs from 'node:fs';
import { Client } from 'pg';
import { getPrisma } from '../src/backend/config/db';
import { GET, POST } from '../src/app/api/emergency-sms/route';
import { GET as adminGet, POST as adminPost } from '../src/app/api/admin/emergency-sms/route';
import bcrypt from 'bcryptjs';
import { staffCredentialVersion } from '../src/backend/utils/staffCredential';
import { signToken } from '../src/backend/utils/jwt';
import { beginSandboxDispatch, emergencyTransaction, issueInvite, runSandboxBatch } from '../src/backend/services/emergencySms';
import { BATCH_DELAY_MS, distanceKm, selectRecipients, type Candidate, smsSegments, validTemplateBody } from '../src/lib/emergencySms';

const point = { latitude: 23.8, longitude: 90.4 };
test('5 km boundary, nearest first, unique numbers and a hard 50-recipient cap', () => {
  const candidate = (i: number, latitude = point.latitude, phoneDigest = 'number-' + i): Candidate =>
    ({ latitude, longitude: point.longitude, userId: String(i), phoneDigest, language: 'bn', lastContact: i });
  const inside = candidate(70, point.latitude + 0.0449);
  const outside = candidate(71, point.latitude + 0.0451);
  assert.ok(distanceKm(point, inside) < 5);
  assert.ok(distanceKm(point, outside) > 5);
  assert.deepEqual(selectRecipients(point, [outside, inside]).map(row => row.userId), ['70']);
  const candidates = [candidate(61, point.latitude, 'number-0'), ...Array.from({ length: 60 }, (_, i) => candidate(i))];
  const result = selectRecipients(point, candidates, 100);
  assert.equal(result.length, 50);
  assert.equal(new Set(result.map(row => row.phoneDigest)).size, 50);
  assert.equal(result[0].userId, '0');
  assert.equal(selectRecipients(point, candidates, 0).length, 0);
});

test('template placeholders and multipart budgets are explicit', () => {
  const valid = '{hospital} {area} {group} {time} {link}';
  assert.equal(validTemplateBody(valid), true);
  assert.equal(validTemplateBody(valid + ' https://external.example'), false);
  assert.equal(validTemplateBody(valid + ' ০১৭১২৩৪৫৬৭৮'), false);
  assert.equal(validTemplateBody(valid + ' {hospital}'), false);
  assert.equal(smsSegments('a'.repeat(160)), 1);
  assert.equal(smsSegments('a'.repeat(161)), 2);
  assert.equal(smsSegments('ক'.repeat(71)), 2);
});

const url = process.env.TEST_EMERGENCY_DATABASE_URL;
let sql: Client | undefined;
before(async () => {
  if (!url) return;
  const target = new URL(url);
  assert.equal(target.hostname, '127.0.0.1');
  assert.equal(target.port, '55613');
  Object.assign(process.env, { DATABASE_URL: url, JWT_SECRET: randomBytes(32).toString('hex'),
    MEDICAL_RECORDS_ENCRYPTION_KEY: randomBytes(32).toString('hex'), EMERGENCY_SMS_MODE: 'sandbox' });
  sql = new Client({ connectionString: url });
  await sql.connect();
  assert.equal((await sql.query("SELECT count(*)::int AS n FROM information_schema.tables WHERE table_schema='public'")).rows[0].n, 0);
  for (const entry of fs.readdirSync('prisma/migrations', { withFileTypes: true }).filter(row => row.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    await sql.query(fs.readFileSync('prisma/migrations/' + entry.name + '/migration.sql', 'utf8'));
  }
});
after(async () => { if (sql) { await getPrisma().$disconnect(); await sql.end(); } });

function req(id?: string, body?: unknown, query = '', origin = 'http://localhost') {
  return new Request('http://localhost/api/emergency-sms' + query, {
    method: body ? 'POST' : 'GET',
    headers: { ...(id ? { authorization: 'Bearer ' + signToken({ user_id: id, role: 'USER' }) } : {}),
      'content-type': 'application/json', origin },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}
async function data(response: Response) {
  const payload = await response.json();
  assert.equal(response.status, 200, JSON.stringify(payload));
  return payload.data;
}

test('synthetic migration, scoped approval, revoked access, consent, 50 dispatches, idempotency and refund', { skip: !url }, async () => {
  const db = getPrisma();
  const createUser = (i: number, blood = 'O+') => db.user.create({ data: {
    id: randomUUID(), profile_code: i.toString().padStart(4, '0'), name: 'Synthetic',
    email: 'emergency-' + i + '@example.invalid', mobile: '+880171999' + i.toString().padStart(4, '0'),
    blood_group: blood, location_city: 'Dhaka', location_country: 'Bangladesh', location_lat: point.latitude, location_lng: point.longitude,
  } });
  const adminId = randomUUID();
  const managerId = randomUUID();
  const password = 'staging-admin-password';
  const hash = await bcrypt.hash(password, 4);
  await db.adminUser.createMany({ data: [
    { id: adminId, admin_id: 'emergency-admin', password: hash, role: 'ADMIN' },
    { id: managerId, admin_id: 'emergency-manager', password: hash, role: 'MANAGER' },
  ] });
  function adminRequest(body?: object, role: 'ADMIN' | 'MANAGER' = 'ADMIN') {
    const id = role === 'ADMIN' ? adminId : managerId;
    return new Request('http://localhost/api/admin/emergency-sms', {
      method: body ? 'POST' : 'GET',
      headers: { authorization: 'Bearer ' + signToken({ user_id: id, role, credential_version: staffCredentialVersion(id, hash) }),
        'content-type': 'application/json', origin: 'http://localhost' },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }
  assert.equal((await adminGet(adminRequest(undefined, 'MANAGER'))).status, 403);
  assert.equal((await adminPost(adminRequest({ action: 'draftTemplate', language: 'bn', body: '{hospital} {area} {group} {time} {link}', password: 'wrong' }))).status, 401);
  const template = await data(await adminPost(adminRequest({
    action: 'draftTemplate', language: 'bn', body: 'জরুরি {hospital} {area} {group} {time} {link}', password,
  })));
  await data(await adminPost(adminRequest({ action: 'publishTemplate', template: template.id, password })));
  assert.equal((await data(await adminGet(adminRequest()))).templates[0].status, 'PUBLISHED');

  const owner = await createUser(0);
  const verifier = await createUser(1);
  const other = await createUser(2);
  const branch = await db.emergencySmsBranch.create({ data: { ...point, active: true, name: 'Synthetic Hospital', area: 'Dhaka', contact: '+8801719990000', sponsor_remaining: 25 } });
  const outsideBranch = await db.emergencySmsBranch.create({ data: { ...point, active: true, name: 'Other Hospital', area: 'Dhaka', contact: '+8801719990001' } });
  const invite = await emergencyTransaction(tx => issueInvite(tx, branch.id, verifier.email, 'VERIFIER', null));
  assert.equal((await POST(req(other.id, { action: 'accept', token: invite }))).status, 403);
  await data(await POST(req(verifier.id, { action: 'accept', token: invite })));
  assert.equal((await POST(req(verifier.id, { action: 'accept', token: invite }))).status, 403);
  assert.equal((await adminGet(new Request('http://localhost/api/admin/emergency-sms'))).status, 401);
  const neededAt = new Date(Date.now() + 3600_000).toISOString();
  const create = (branchId: string, reference: string, group = 'O+') => ({ action: 'create', branch: branchId, reference, group, component: 'WHOLE_BLOOD', neededAt });
  assert.equal((await POST(req(owner.id, create(branch.id, 'REF-1'), '', 'https://invalid.example'))).status, 403);
  const requestId = (await data(await POST(req(owner.id, create(branch.id, 'REF-1'))))).id;
  assert.equal((await data(await POST(req(owner.id, create(branch.id, 'REF-1'))))).id, requestId);
  const otherId = (await data(await POST(req(owner.id, create(outsideBranch.id, 'REF-2'))))).id;
  assert.equal((await POST(req(verifier.id, { action: 'operate', step: 'VERIFY', id: otherId }))).status, 403);
  assert.equal((await GET(req(other.id, undefined, '?view=detail&id=' + requestId))).status, 404);
  await data(await POST(req(verifier.id, { action: 'operate', step: 'VERIFY', id: requestId })));
  assert.equal((await POST(req(owner.id, { action: 'start', funding: 'PAID', count: 1, id: requestId }))).status, 409);

  const donors = [];
  for (let i = 3; i <= 56; i++) {
    const donor = await createUser(i, i === 56 ? 'A+' : 'O+');
    donors.push(donor);
    await data(await POST(req(donor.id, { action: 'consent', ...point, latitude: i === 55 ? 24 : point.latitude, language: 'bn', available: true, agree: true })));
  }
  const quote = await data(await GET(req(owner.id, undefined, '?view=detail&id=' + requestId)));
  assert.equal(quote.paidCount, 50);
  assert.equal(quote.pilotCount, 20);
  assert.doesNotMatch(JSON.stringify(quote), /\+880|latitude|longitude|REF-1/);
  assert.equal((await POST(req(owner.id, { action: 'start', funding: 'PAID', count: 49, id: requestId }))).status, 409);
  const start = () => POST(req(owner.id, { action: 'start', funding: 'PAID', count: 50, id: requestId }));
  assert.deepEqual((await Promise.all([start(), start()])).map(response => response.status), [200, 200]);
  const startTime = Date.now() + 1000;
  for (let batch = 0; batch < 5; batch++)
    assert.equal(await runSandboxBatch(new Date(startTime + batch * BATCH_DELAY_MS)), true);
  assert.equal(await db.emergencySmsDelivery.count({ where: { request_id: requestId } }), 50);
  const paid = await db.emergencySmsRequest.findUniqueOrThrow({ where: { id: requestId } });
  assert.equal(paid.charged_paisa, 3500);
  assert.equal(JSON.parse(paid.template_version!).bn, template.id);
  assert.equal(paid.status, 'DISPATCH_COMPLETE');

  const refundId = (await data(await POST(req(owner.id, create(branch.id, 'REF-3', 'A+'))))).id;
  await data(await POST(req(verifier.id, { action: 'operate', step: 'VERIFY', id: refundId })));
  await emergencyTransaction(async tx => beginSandboxDispatch(tx,
    await tx.emergencySmsRequest.findUniqueOrThrow({ where: { id: refundId } }), 'PAID', 1));
  await data(await POST(req(donors.at(-1)!.id, { action: 'withdraw' })));
  assert.equal(await runSandboxBatch(), true);
  assert.equal((await db.emergencySmsRequest.findUniqueOrThrow({ where: { id: refundId } })).refund_paisa, 3500);
  await db.emergencySmsAccess.updateMany({ where: { branch_id: branch.id }, data: { revoked_at: new Date() } });
  assert.equal((await POST(req(verifier.id, { action: 'operate', step: 'CONFIRM', id: requestId }))).status, 403);
  delete process.env.EMERGENCY_SMS_MODE;
  assert.equal((await data(await GET(req()))).enabled, false);
  assert.equal(await runSandboxBatch(), false);
});
