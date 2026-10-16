import { before, after, test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { randomBytes, randomUUID } from 'node:crypto';
import { Client } from 'pg';
import sharp from 'sharp';
import { nextProfileCodeChange, normalizeProfileCode, PROFILE_CODE_PATTERN } from '../src/lib/profileIdentifier';
import { normalizeOrganName } from '../src/lib/organCatalog';
import { organFromSlug, organToSlug } from '../src/lib/seoRouting';
import { encryptMedical, decryptMedical, medicalUser } from '../src/backend/utils/medicalPrivacy';
import { boundedBody } from '../src/backend/utils/boundedBody';
import { changeProfileCode } from '../src/backend/services/profileIdentifiers';
import { createMedicalReport, ReportSchema, listMedicalTimeline, optimizeMedicalImage } from '../src/backend/services/medicalReports';
import { acceptPrescription, authorizePrescriptionProvider, deliverPrescriptionEmail, PrescriptionSchema, prescriptionHtml } from '../src/backend/services/prescriptions';
import { getPrisma } from '../src/backend/config/db';
import { UserRepository } from '../src/backend/repositories/UserRepository';
import { signToken } from '../src/backend/utils/jwt';
import { GET as downloadFile } from '../src/app/api/users/me/medical-reports/[reportId]/files/[fileId]/route';
import { GET as inbox, POST as uploadPrescription } from '../src/app/api/users/me/prescriptions/route';
import { GET as downloadPrescription } from '../src/app/api/users/me/prescriptions/[prescriptionId]/route';
import { POST as submitPrescription } from '../src/app/api/integrations/prescriptions/route';
import { POST as searchMedicalHistory } from '../src/app/api/users/me/medical-records/history/route';
import { POST as uploadMedicalReport } from '../src/app/api/users/me/medical-reports/route';
import { POST as collectClicks } from '../src/app/api/analytics/clicks/route';
import { POST as collectLegacyHeatmap } from '../src/app/api/analytics/heatmap/route';
import { GET as heatmapAnalytics } from '../src/app/api/admin/analytics/heatmap/route';
import { GET as medicalOperations } from '../src/app/api/admin/medical-operations/route';
import { documentClick, analyticsPagePath, analyticsPageKey, ClickEventSchema } from '../src/lib/analytics';
import { getSiteContent } from '../src/backend/services/policyContent';
import { AuthService } from '../src/backend/services/AuthService';
import { signLocationProof } from '../src/backend/utils/locationProof';
import { PATCH as updateOrgans } from '../src/app/api/users/me/organs/route';
import { GET as publicOrganDonors } from '../src/app/api/public/organ-donors/route';
import { GET as publicBloodDonors } from '../src/app/api/public/donors/route';
import { getDonorLocations, findDonorLocation, donorLocationPath } from '../src/backend/services/donorLocations';
import { donorLocationMetadata } from '../src/components/DonorLocationLanding';
import { GET as locationSitemap } from '../src/app/sitemap-location.xml/route';
import { getOrganTypesWithData } from '../src/backend/services/seoData';
import { toLocationSlug } from '../src/backend/utils/locationSlug';
import { getActiveBloodDonorCounts } from '../src/backend/services/donorCounts';
import { getPublicBotStats } from '../src/backend/services/seoData';
import { GET as dashboardOverview } from '../src/app/api/admin/dashboard-overview/route';
import { GET as siteState } from '../src/app/site-state.json/route';
import { GET as platformStats } from '../src/app/api/public/platform-stats/route';
import { GET as publicOrganRequests } from '../src/app/api/public/organ-requests/route';
import { GET as detectCountry } from '../src/app/api/location/ip/route';
import { GET as auditProfile } from '../src/app/api/admin/users/[userId]/route';
import { GET as selfProfile } from '../src/app/api/users/me/profile/route';
import { POST as auditHistory } from '../src/app/api/admin/users/[userId]/medical-records/history/route';
import { GET as auditFile } from '../src/app/api/admin/users/[userId]/medical-reports/[reportId]/files/[fileId]/route';
import { GET as auditPrescription } from '../src/app/api/admin/users/[userId]/prescriptions/[prescriptionId]/route';
import { discoverDonors } from '../src/lib/donorDiscovery';
import { automaticIpLocation, publicClientIp } from '../src/backend/services/automaticLocation';

// Always use process-local test secrets, never production credentials.
process.env.MEDICAL_RECORDS_ENCRYPTION_KEY = randomBytes(32).toString('hex');
process.env.DOCTOR_PRESCRIPTION_API_KEY = randomBytes(32).toString('hex');
process.env.JWT_SECRET = randomBytes(32).toString('hex');
Object.assign(process.env, { NODE_ENV: 'test' });
process.env.SMTP_HOST = '127.0.0.1';
process.env.SMTP_USER = 'test@example.invalid';
process.env.SMTP_PASS = 'test-only';
process.env.GEOAPIFY_API_KEY = 'test-only';

const testUrl = process.env.TEST_DATABASE_URL;
const integration = { skip: !testUrl };
let sql: Client;
const testAdminId = randomUUID();
let migratedUserId: string;
let existingRows: Record<string, unknown> = {};
let existingToken: string;
let legacyReportId: string;
let legacyReportPayload: Buffer;

before(async () => {
  if (!testUrl) return;
  const url = new URL(testUrl);
  assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Only a local test database is permitted.');
  assert.match(url.pathname, /^\/bloodnet_medical_test_\d+$/, 'Use a uniquely named disposable database.');
  process.env.DATABASE_URL = testUrl;
  sql = new Client({ connectionString: testUrl }); await sql.connect();
  const count = await sql.query("SELECT COUNT(*)::int AS n FROM information_schema.tables WHERE table_schema='public'");
  assert.equal(count.rows[0].n, 0, 'Refusing to modify a database that is not empty.');
  for (const entry of readdirSync('prisma/migrations', { withFileTypes: true }).filter(entry => entry.isDirectory() && entry.name < '20261011090000_private_medical_profile').sort((a,b) => a.name.localeCompare(b.name))) {
    await sql.query(readFileSync(path.join('prisma/migrations',entry.name,'migration.sql'),'utf8'));
  }
  await sql.query('INSERT INTO "AdminUser" (id,admin_id,password,role) VALUES ($1,$2,$3,$4)', [testAdminId,'security-test-admin','test-only','ADMIN']);
  migratedUserId = randomUUID();
  await sql.query('INSERT INTO "User" (id,name,email,mobile,blood_group,location_city,location_country,location_lat,location_lng,updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())', [migratedUserId,'Migration Patient','migration@example.invalid','migration-mobile','A+','Dhaka','Bangladesh',23.81,90.41]);
  await sql.query(`UPDATE "User" SET profile_image_url = 'https://example.invalid/avatar.webp', date_of_birth = '1990-05-12', health_data = '{"weight":65,"allergies":["Dust"]}', verification_status = 'VERIFIED', last_donation_date = '2026-01-01' WHERE id=$1`, [migratedUserId]);
  await sql.query(`INSERT INTO "OrganPledge" (id,user_id,organ_type,updated_at) VALUES ($1,$2,'Kidney',NOW())`, [randomUUID(),migratedUserId]);
  await sql.query(`INSERT INTO "UserServiceCity" (id,user_id,city,country,formatted_location,lat,lng,provider_place_id,locked_until) VALUES ($1,$2,'Dhaka','Bangladesh','Dhaka, Bangladesh',23.81,90.41,'legacy-dhaka','2026-01-01')`, [randomUUID(),migratedUserId]);
  await sql.query(`INSERT INTO "VerificationDocument" (id,user_id,document_type,asset_url,review_status,updated_at) VALUES ($1,$2,'MEDICAL_REPORT','https://example.invalid/legacy.webp','APPROVED',NOW())`, [randomUUID(),migratedUserId]);
  existingToken = signToken({user_id:migratedUserId,role:'USER'});
  const tables = await sql.query("SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename");
  for (const {tablename} of tables.rows) {
    const escaped = tablename.replace(/"/g, '""');
    existingRows[tablename] = (await sql.query(`SELECT COALESCE(jsonb_agg(to_jsonb(t) ORDER BY to_jsonb(t)::text), '[]'::jsonb) AS rows FROM "${escaped}" t`)).rows[0].rows;
  }
  await sql.query(readFileSync('prisma/migrations/20261011090000_private_medical_profile/migration.sql','utf8'));
  legacyReportId=randomUUID();
  legacyReportPayload=encryptMedical(Buffer.from(JSON.stringify({title:'Legacy CBC',category:'Lab result',reportDate:'2020-02-03',facility:'Legacy Lab',clinician:'',notes:'Original notes',files:[]})),`report:${migratedUserId}:${legacyReportId}`);
  await sql.query('INSERT INTO "MedicalReport" (id,user_id,payload) VALUES ($1,$2,$3)',[legacyReportId,migratedUserId,legacyReportPayload]);
  await sql.query(readFileSync('prisma/migrations/20261014090000_medical_record_timelines/migration.sql','utf8'));
  await sql.query(readFileSync('prisma/migrations/20261014120000_analytics_coordinates/migration.sql','utf8'));
  await sql.query(readFileSync('prisma/migrations/20261016090000_opt_in_public_donor_profiles/migration.sql','utf8'));
  await sql.query(readFileSync('prisma/migrations/20261016120000_user_login_emails/migration.sql','utf8'));
  await sql.query(readFileSync('prisma/migrations/20261016140000_discovery_visibility/migration.sql','utf8'));
});
after(async () => { if (testUrl) { await getPrisma().$disconnect(); await sql?.end(); } });

const newPatient = () => new UserRepository().createUser({ name: 'Test Patient', email: `${randomUUID()}@example.invalid`, mobile: randomUUID(), blood_group: 'A+', location_city: 'Dhaka', location_country: 'Bangladesh', location_lat: 23.81, location_lng: 90.41 });
const patientRequest = (url: string, userId: string, method = 'GET') => new Request(url, { method, headers: { authorization: `Bearer ${signToken({ user_id: userId, role: 'USER' })}` } });
const samplePrescription = (code: string) => ({ patientProfileId: code, externalId: randomUUID(), patientConsent: true, issuedAt: '2026-01-01T10:00:00Z', doctor: { name: 'Test Doctor', registrationNumber: 'TEST-123', clinic: 'Test Clinic' }, medications: [{ name: 'Example medicine', dose: 'As prescribed', frequency: 'As prescribed', duration: 'As prescribed', instructions: 'Synthetic test data.' }], advice: 'Test advice only.' });

test('four-character IDs accept letters, numbers, and mixed case normalization', () => {
  for (const id of ['john','aB12','1234']) assert.ok(PROFILE_CODE_PATTERN.test(normalizeProfileCode(id)));
  for (const id of ['ABCDE','ABC','A-12','💉123']) assert.ok(!PROFILE_CODE_PATTERN.test(normalizeProfileCode(id)));
});
test('six calendar months clamp month-end, leap years, and preserve time', () => {
  assert.equal(nextProfileCodeChange('2023-08-31T12:30:00Z')?.toISOString(), '2024-02-29T12:30:00.000Z');
  assert.equal(nextProfileCodeChange('2024-08-31T12:30:00Z')?.toISOString(), '2025-02-28T12:30:00.000Z');
  assert.equal(nextProfileCodeChange(null), null);
});
test('medical encryption rejects tampering and cross-patient contexts', () => {
  const text = Buffer.from('private report'); const encrypted = encryptMedical(text,'patient-a');
  assert.deepEqual(decryptMedical(encrypted,'patient-a'),text);
  assert.throws(() => decryptMedical(encrypted,'patient-b'));
  const altered = Buffer.from(encrypted); altered[altered.length - 1] ^= 1;
  assert.throws(() => decryptMedical(altered,'patient-a'));
  assert.ok(!encrypted.includes(text));
});
test('report dates, categories, consent, and prescription details are validated', () => {
  const details = { title:'CBC',category:'Lab result',reportDate:'2026-02-31',facility:'Test Lab',clinician:'',notes:'' };
  assert.ok(!ReportSchema.safeParse(details).success);
  assert.ok(!PrescriptionSchema.safeParse({ ...samplePrescription('AB12'), patientConsent: false }).success);
});
test('bone marrow normalizes and maps to searchable URLs', () => {
  for (const name of ['Bone Marrow','bone-marrow','marrow']) assert.equal(normalizeOrganName(name),'Bone Marrow');
  assert.equal(organFromSlug('bone-marrow'),'Bone Marrow'); assert.equal(organToSlug('Bone Marrow'),'bone-marrow');
});
test('prescription output escapes untrusted clinician and medical text', () => {
  const details = samplePrescription('AB12'); details.doctor.name = '<script>bad()</script>';
  const html = prescriptionHtml(details,'<img src=x>');
  assert.ok(!html.includes('<script>')); assert.ok(html.includes('&lt;script&gt;')); assert.ok(html.includes('&lt;img src=x&gt;'));
});
test('provider secret and patient access reject unauthorized/cross-origin requests', () => {
  assert.throws(() => authorizePrescriptionProvider(new Request('https://bloodnet.test/api/integrations/prescriptions')));
  assert.equal(authorizePrescriptionProvider(new Request('https://bloodnet.test/api/integrations/prescriptions',{ headers: { authorization:`Bearer ${process.env.DOCTOR_PRESCRIPTION_API_KEY}` } })),'doctor-portal');
  assert.throws(() => medicalUser(new Request('https://bloodnet.test/api/users/me/prescriptions')));
  assert.throws(() => medicalUser(new Request('https://bloodnet.test/api/users/me/profile-id',{ method:'PATCH', headers:{origin:'https://evil.test',authorization:`Bearer ${signToken({user_id:'test',role:'USER'})}`} })));
});
test('chunked request limit is enforced even without Content-Length', async () => {
  const req = new Request('https://bloodnet.test/api',{ method:'POST', body:'x'.repeat(100) });
  await assert.rejects(() => boundedBody(req,10), /too large/);
});
test('migration backfills a reserved ID and preserves existing UUIDs', integration, async () => {
  const user = await getPrisma().user.findUniqueOrThrow({ where:{id:migratedUserId} });
  assert.equal(user.profile_code,'0000'); assert.equal(user.profile_code_changed_at,null);
  assert.equal((await getPrisma().profileIdentifier.findUniqueOrThrow({where:{code:'0000'}})).user_id,migratedUserId);
  for (const [table,rows] of Object.entries(existingRows)) {
    const escaped = table.replace(/"/g, '""');
    const expression = table === 'User' ? "to_jsonb(t) - 'profile_code' - 'profile_code_changed_at'" : 'to_jsonb(t)';
    const actual = (await sql.query(`SELECT COALESCE(jsonb_agg(${expression} ORDER BY (${expression})::text), '[]'::jsonb) AS rows FROM "${escaped}" t`)).rows[0].rows;
    assert.deepEqual(actual,rows,`Existing ${table} data must be preserved exactly`);
  }
});

test('existing sessions and migrated users can use IDs, reports, prescriptions, and bone marrow', integration, async () => {
  const request = new Request('http://localhost/api/users/me', {headers:{authorization:`Bearer ${existingToken}`}});
  assert.equal(medicalUser(request), migratedUserId);
  await changeProfileCode(migratedUserId, 'OLD1');
  const form = new FormData();
  for (const [key,value] of Object.entries({title:'Existing patient report',category:'Lab result',reportDate:'2026-01-01',facility:'Test Lab'})) form.set(key,value);
  const png = await sharp({create:{width:8,height:8,channels:3,background:'white'}}).png().toBuffer();
  form.set('files', new File([new Uint8Array(png)], 'old-user.png', {type:'image/png'}));
  assert.ok((await createMedicalReport(migratedUserId,form)).id);
  const prescription = await acceptPrescription('doctor-portal',samplePrescription('OLD1'));
  assert.ok((await getPrisma().prescription.findUniqueOrThrow({where:{id:prescription.id}})).user_id === migratedUserId);
  await getPrisma().organPledge.create({data:{user_id:migratedUserId,organ_type:'Bone Marrow'}});
  assert.equal((await getPrisma().organPledge.findMany({where:{user_id:migratedUserId}})).length, 2);
});

test('VPS HTTPS cookie sessions can open history and save reports through an internal HTTP proxy', integration, async () => {
  const previous = process.env.NEXT_PUBLIC_BASE_URL;
  process.env.NEXT_PUBLIC_BASE_URL = 'https://bloodnet.live';
  const headers = { origin: 'https://bloodnet.live', cookie: `bloodnet_session=${existingToken}`, 'content-type': 'application/json' };
  const request = () => new Request('http://127.0.0.1:3000/api/users/me/medical-records/history', { method: 'POST', headers, body: JSON.stringify({ mode: 'reports' }) });
  try {
    assert.equal((await searchMedicalHistory(request())).status, 200);
    const form = new FormData();
    for (const [name, value] of Object.entries({ title: 'Proxy regression report', category: 'Lab result', reportDate: '2026-01-01', facility: 'Synthetic Lab' })) form.set(name, value);
    const image = await sharp({ create: { width: 8, height: 8, channels: 3, background: 'white' } }).png().toBuffer();
    form.append('files', new File([new Uint8Array(image)], 'report.png', { type: 'image/png' }));
    const uploaded = await uploadMedicalReport(new Request('http://127.0.0.1:3000/api/users/me/medical-reports', { method: 'POST', headers: { origin: headers.origin, cookie: headers.cookie }, body: form }));
    assert.equal(uploaded.status, 201);
    const record = await getPrisma().medicalReport.findFirstOrThrow({ where: { user_id: migratedUserId }, orderBy: { created_at: 'desc' } });
    assert.equal(record.user_id, migratedUserId);
    const foreign = new Request(request(), { headers: { ...headers, origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' } });
    const blocked = await searchMedicalHistory(foreign);
    assert.equal(blocked.status, 403);
    assert.equal(blocked.headers.get('set-cookie'), null);
    assert.equal((await searchMedicalHistory(request())).status, 200);
    assert.equal((await searchMedicalHistory(new Request(request(), { headers: { origin: headers.origin, 'content-type': 'application/json' } }))).status, 401);
  } finally { if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_URL; else process.env.NEXT_PUBLIC_BASE_URL = previous; }
});
test('new registrations get reserved IDs; concurrent claims have one winner', integration, async () => {
  const [first,second] = await Promise.all([newPatient(),newPatient()]);
  assert.ok(PROFILE_CODE_PATTERN.test(first.profile_code)); assert.notEqual(first.profile_code,second.profile_code);
  const claims = await Promise.allSettled([changeProfileCode(first.id,'RACE'),changeProfileCode(second.id,'race')]);
  assert.equal(claims.filter(result=>result.status==='fulfilled').length,1);
  assert.equal(claims.filter(result=>result.status==='rejected').length,1);
});
test('cooldown is server-enforced and retired IDs cannot be reassigned', integration, async () => {
  const user = await newPatient(); const other = await newPatient();
  await changeProfileCode(user.id,'ALFA');
  await assert.rejects(()=>changeProfileCode(user.id,'BETA'),/next be changed/);
  await getPrisma().user.update({where:{id:user.id},data:{profile_code_changed_at:new Date('2020-01-01')}});
  await changeProfileCode(user.id,'BETA');
  await assert.rejects(()=>changeProfileCode(other.id,'ALFA'),/taken or reserved/);
  await assert.rejects(()=>acceptPrescription('doctor-portal',samplePrescription('ALFA')),/No registered patient/);
});
test('report uploads stay encrypted and cross-patient downloads are denied', integration, async () => {
  const owner = await newPatient(); const other = await newPatient();
  const form = new FormData();
  for(const [key,value] of Object.entries({title:'Private CBC',category:'Lab result',reportDate:'2026-01-01',facility:'Private Lab',clinician:'Test Doctor',notes:'Private notes'}))form.set(key,value);
  const png = await sharp({create:{width:8,height:8,channels:3,background:'white'}}).png().toBuffer();
  form.set('files',new File([new Uint8Array(png)],'lab.png',{type:'image/png'}));
  const report = await createMedicalReport(owner.id,form);
  const stored = await getPrisma().medicalReport.findUniqueOrThrow({where:{id:report.id}});
  assert.ok(!Buffer.from(stored.payload).includes(Buffer.from('Private CBC')));
  const params = Promise.resolve({reportId:report.id,fileId:report.files[0].id});
  const ok = await downloadFile(patientRequest('http://localhost/api/files',owner.id),{params});
  assert.equal(ok.status,200); assert.equal(ok.headers.get('cache-control'),'private, no-store'); assert.equal(ok.headers.get('content-type'),'image/webp');
  assert.equal((await downloadFile(patientRequest('http://localhost/api/files',other.id),{params})).status,404);
  assert.equal((await downloadFile(new Request('http://localhost/api/files'),{params})).status,401);
});
test('prescriptions are idempotent, patient-owned, and duplicate mail claims are serialized', integration, async () => {
  const owner = await newPatient(); const other = await newPatient(); const input = samplePrescription(owner.profile_code);
  const results = await Promise.all([acceptPrescription('doctor-portal',input),acceptPrescription('doctor-portal',input)]);
  assert.equal(results[0].id,results[1].id);
  await assert.rejects(()=>acceptPrescription('doctor-portal',{...input,advice:'Different content'}),/different prescription/);
  const listed = await inbox(patientRequest('http://localhost/api/users/me/prescriptions',owner.id));
  assert.equal((await listed.json()).data.items.length,1);
  assert.equal((await (await inbox(patientRequest('http://localhost/api/users/me/prescriptions',other.id))).json()).data.items.length,0);
  const params=Promise.resolve({prescriptionId:results[0].id});
  assert.equal((await downloadPrescription(patientRequest('http://localhost/api/download',other.id),{params})).status,404);
  const {transporter}=await import('../src/backend/utils/mailer'); const original=transporter.sendMail; let mails=0;
  transporter.sendMail=(async (message: {to:string;html:string})=>{assert.equal(message.to,owner.email);assert.ok(message.html.includes('Example medicine'));mails++;return {};}) as typeof transporter.sendMail;
  try {await Promise.all([deliverPrescriptionEmail(results[0].id),deliverPrescriptionEmail(results[0].id)]);}finally{transporter.sendMail=original;}
  assert.equal(mails,1); assert.equal((await getPrisma().prescription.findUniqueOrThrow({where:{id:results[0].id}})).email_status,'SENT');
});
test('SMTP failure preserves the inbox record and schedules retry', integration, async () => {
  const user=await newPatient();const accepted=await acceptPrescription('doctor-portal',samplePrescription(user.profile_code));
  const {transporter}=await import('../src/backend/utils/mailer');const original=transporter.sendMail;
  transporter.sendMail=(async()=>{throw new Error('Test SMTP failure');}) as typeof transporter.sendMail;
  try {await deliverPrescriptionEmail(accepted.id);}finally{transporter.sendMail=original;}
  const row=await getPrisma().prescription.findUniqueOrThrow({where:{id:accepted.id}});
  assert.equal(row.email_status,'RETRY');assert.ok(row.email_next_attempt_at>new Date());assert.equal(row.email_attempts,1);
});
test('integration endpoint authenticates before accepting patient data', integration, async () => {
  const res=await submitPrescription(new Request('http://localhost/api/integrations/prescriptions',{method:'POST',headers:{'content-type':'application/json'},body:'{}'}));
  assert.equal(res.status,401);
});

test('authorized doctor submissions persist immediately and queue email without SMTP', integration, async () => {
  const patient = await newPatient(); const input = samplePrescription(patient.profile_code);
  const request = () => new Request('http://localhost/api/integrations/prescriptions', {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.DOCTOR_PRESCRIPTION_API_KEY}` }, body: JSON.stringify(input),
  });
  const res = await submitPrescription(request()); assert.equal(res.status,201);
  const body = await res.json(); assert.equal(body.data.emailStatus,'PENDING');
  const stored = await getPrisma().prescription.findUniqueOrThrow({ where: { id: body.data.id } });
  assert.equal(stored.user_id,patient.id); assert.equal(stored.email_attempts,0);
  const duplicate = await submitPrescription(request()); assert.equal(duplicate.status,200);
  assert.equal((await duplicate.json()).data.id,stored.id);
});

test('existing OTP registration retains its session and cities while assigning a patient ID', integration, async () => {
  const { AuthController } = await import('../src/backend/controllers/AuthController');
  const email = `${randomUUID()}@example.invalid`;
  await new AuthService().storeOTP(email,'123456');
  const city = { city:'Dhaka', country:'Bangladesh', formatted_location:'Dhaka, Bangladesh', latitude:23.81, longitude:90.41, provider_place_id:'test-city' };
  const res = await AuthController.verifyOtp(new Request('http://localhost/api/auth/otp/verify', {
    method:'POST', headers:{'content-type':'application/json'}, body:JSON.stringify({email,otp:'123456',name:'Signup Patient',dateOfBirth:'2000-01-01T00:00:00Z',mobile:randomUUID(),bloodGroup:'A+',locations:[{...city,token:signLocationProof(city)}]}),
  }));
  assert.equal(res.status,200); const body = await res.json();
  assert.ok(body.sessionToken); assert.ok(res.headers.get('set-cookie')?.includes('bloodnet_session='));
  const user = await getPrisma().user.findUniqueOrThrow({where:{id:body.user.id},include:{ServiceCities:true}});
  assert.match(user.profile_code,PROFILE_CODE_PATTERN); assert.equal(user.ServiceCities.length,1);
  assert.equal((await getPrisma().profileIdentifier.findUniqueOrThrow({where:{code:user.profile_code}})).user_id,user.id);
  assert.equal(await getPrisma().otpVerification.findUnique({where:{email}}),null);
});

test('bone marrow persists through the existing organ API and public donor search', integration, async () => {
  const user = await newPatient();
  const res = await updateOrgans(new Request('http://localhost/api/users/me/organs',{
    method:'PATCH',headers:{'content-type':'application/json',authorization:`Bearer ${signToken({user_id:user.id,role:'USER'})}`},body:JSON.stringify({organs:['bone-marrow','Kidney']}),
  }));
  assert.equal(res.status,200); assert.deepEqual((await res.json()).data.organs,['Bone Marrow','Kidney']);
  assert.equal(await getPrisma().organPledge.count({where:{user_id:user.id,organ_type:'Bone Marrow',is_active:true}}),1);
  const found = await publicOrganDonors(new Request('http://localhost/api/public/organ-donors?organ=bone-marrow'));
  assert.equal(found.status,200); const body = await found.json();
  assert.ok(body.data.some((item:{id:string;organ_type?:string;organType?:string})=>item.id===user.id));
});

test('document optimization bounds camera images, strips metadata and keeps readable dimensions', async()=>{
  const svg=Buffer.from(`<svg width="3600" height="4800" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="white"/>${Array.from({length:70},(_,i)=>`<text x="100" y="${100+i*60}" font-size="36">Synthetic test ${i}: 7.2 mg/dL · reference 4.0–8.0</text>`).join('')}</svg>`);
  const original=await sharp(svg).jpeg({quality:100}).withMetadata().toBuffer();
  const optimized=await optimizeMedicalImage(original);
  const metadata=await sharp(optimized.data).metadata();
  assert.equal(metadata.format,'webp');assert.equal(metadata.exif,undefined);
  assert.ok(optimized.width<=2400&&optimized.height<=3200);
  assert.ok(optimized.width>=2000,'Retain document-sized resolution for fine text.');
  assert.ok(optimized.data.length<original.length);
  const small=await optimizeMedicalImage(await sharp({create:{width:50,height:80,channels:3,background:'white'}}).png().toBuffer());
  assert.equal(small.width,50);assert.equal(small.height,80);
});

test('timeline migration preserves encrypted legacy metadata and backfills its actual test date',integration,async()=>{
  const before=await getPrisma().medicalReport.findUniqueOrThrow({where:{id:legacyReportId}});
  assert.deepEqual(Buffer.from(before.payload),legacyReportPayload);assert.equal(before.record_kind,'REPORT');
  const timeline=await listMedicalTimeline(migratedUserId,'reports',new URLSearchParams({q:'Legacy CBC'}));
  assert.equal(timeline.items[0].id,legacyReportId);
  const after=await getPrisma().medicalReport.findUniqueOrThrow({where:{id:legacyReportId}});
  assert.equal(after.record_date?.toISOString().slice(0,10),'2020-02-03');
  assert.deepEqual(Buffer.from(after.payload),legacyReportPayload);
});

async function uploadForm(title='Synthetic report',date='2026-01-01') {
  const form=new FormData();for(const[key,value]of Object.entries({title,category:'Blood test',reportDate:date,facility:'Synthetic Lab',clinician:'Synthetic Doctor'}))form.set(key,value);
  const png=await sharp({create:{width:80,height:80,channels:3,background:'white'}}).png().toBuffer();
  form.set('files',new File([new Uint8Array(png)],'synthetic.png',{type:'image/png'}));return form;
}

test('multiple pages and rich test results remain encrypted; retries cannot duplicate an entry',integration,async()=>{
  const owner=await newPatient(),form=await uploadForm();form.set('uploadKey',randomUUID());
  form.set('testName','CBC');form.set('sampleType','Blood');form.set('sampleCollectedOn','2025-12-31');
  form.set('results',JSON.stringify([{test:'Platelets',value:'210',unit:'10^9/L',referenceRange:'150–450',flag:'Normal'}]));
  form.append('files',form.get('files')!);
  const records=await Promise.all([createMedicalReport(owner.id,form),createMedicalReport(owner.id,form)]);
  assert.equal(records[0].id,records[1].id);
  assert.equal(await getPrisma().medicalReport.count({where:{user_id:owner.id}}),1);
  assert.equal(records[0].files.length,2);assert.equal(records[0].results?.[0].value,'210');
  assert.ok(records[0].files.every(file=>file.mimeType==='image/webp'&&file.sizeBytes&&file.originalBytes));
  form.set('title','Different content');await assert.rejects(()=>createMedicalReport(owner.id,form),/different content/);
  const stored=await getPrisma().medicalReport.findUniqueOrThrow({where:{id:records[0].id}});
  assert.ok(!Buffer.from(stored.payload).includes(Buffer.from('Platelets')));
});

test('timelines use clinical dates, search older encrypted metadata, and paginate without repeats',integration,async()=>{
  const owner=await newPatient();
  const data=Array.from({length:55},(_,i)=>{
    const id=randomUUID(),day=new Date(Date.UTC(2025,0,i+1));
    const details={title:`History ${i}`,category:i===0?'MRI':'Lab result',reportDate:day.toISOString().slice(0,10),facility:'Synthetic Lab',clinician:'',notes:i===0?'Rare searchable finding':'',files:[]};
    return{id,user_id:owner.id,record_kind:'REPORT',record_date:day,payload:encryptMedical(Buffer.from(JSON.stringify(details)),`report:${owner.id}:${id}`)};
  });
  await getPrisma().medicalReport.createMany({data});
  let cursor:string|null=null;const seen=new Set<string>();
  do {const params=new URLSearchParams();if(cursor)params.set('cursor',cursor);const page=await listMedicalTimeline(owner.id,'reports',params);for(const item of page.items){assert.ok(!seen.has(item.id));seen.add(item.id);}cursor=page.nextCursor;}while(cursor);
  assert.equal(seen.size,55);
  const first=await listMedicalTimeline(owner.id,'reports');assert.equal(first.items[0].id,data[54].id);
  const found=await listMedicalTimeline(owner.id,'reports',new URLSearchParams({q:'Rare searchable finding',category:'MRI',from:'2025-01-01',to:'2025-01-01'}));
  assert.equal(found.items.length,1);assert.equal(found.items[0].id,data[0].id);
  assert.equal((await listMedicalTimeline((await newPatient()).id,'reports')).items.length,0);
  await assert.rejects(()=>listMedicalTimeline(owner.id,'reports',new URLSearchParams({cursor:'invalid'})),/cursor/);
});

test('patient prescriptions require doctor/date, share a dated timeline with doctor deliveries, and stay private',integration,async()=>{
  const owner=await newPatient(),form=await uploadForm('Uploaded prescription','2025-01-01');
  form.set('clinician','');await assert.rejects(()=>createMedicalReport(owner.id,form,'PRESCRIPTION'),/doctor name/);
  form.set('clinician','Synthetic Prescriber');form.set('doctorSpecialty','Cardiology');form.set('notes','As written by the clinician.');
  const headers={authorization:`Bearer ${signToken({user_id:owner.id,role:'USER'})}`};
  const result=await uploadPrescription(new Request('http://localhost/api/users/me/prescriptions',{method:'POST',headers,body:form}));
  assert.equal(result.status,201);const saved=(await result.json()).data;
  assert.equal(saved.kind,'uploaded-prescription');
  assert.equal(saved.createdAt,(await getPrisma().medicalReport.findUniqueOrThrow({where:{id:saved.id}})).created_at.toISOString());
  assert.equal(await getPrisma().prescription.count({where:{user_id:owner.id}}),0,'Uploads must not enter the doctor email queue.');
  await acceptPrescription('doctor-portal',samplePrescription(owner.profile_code));
  const timeline=await listMedicalTimeline(owner.id,'prescriptions');assert.equal(timeline.items.length,2);
  assert.equal(timeline.items[0].kind,'doctor-prescription');assert.equal(timeline.items[1].kind,'uploaded-prescription');
  assert.equal((await listMedicalTimeline(owner.id,'reports')).items.length,0);
  const history=await searchMedicalHistory(new Request('http://localhost/api/users/me/medical-records/history',{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({mode:'prescriptions'})}));
  const historyData=(await history.json()).data;
  assert.deepEqual(historyData.counts,{reports:0,prescriptions:2});
  assert.equal(historyData.items.find((item:{id:string})=>item.id===saved.id).kind,'uploaded-prescription');
  const params=Promise.resolve({reportId:saved.id,fileId:saved.files[0].id});
  const preview=await downloadFile(patientRequest('http://localhost/api/file?preview=1',owner.id),{params});
  assert.equal(preview.status,200);assert.match(preview.headers.get('content-disposition')! ,/^inline/);
  assert.equal(preview.headers.get('cache-control'),'private, no-store');
  assert.equal((await downloadFile(patientRequest('http://localhost/api/file?preview=1',(await newPatient()).id),{params})).status,404);
});

test('private history filters authenticate before reading and search without medical terms in the URL',integration,async()=>{
  const url='http://localhost/api/users/me/medical-records/history';
  assert.equal((await searchMedicalHistory(new Request(url,{method:'POST',body:'{}'}))).status,401);
  const owner=await newPatient(),form=await uploadForm('Private search result');form.set('findings','Synthetic searchable finding');
  await createMedicalReport(owner.id,form);
  const headers={authorization:`Bearer ${signToken({user_id:owner.id,role:'USER'})}`,'content-type':'application/json'};
  const response=await searchMedicalHistory(new Request(url,{method:'POST',headers,body:JSON.stringify({mode:'reports',q:'Synthetic searchable finding'})}));
  assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'private, no-store');
  assert.equal((await response.json()).data.items.length,1);
  assert.equal((await searchMedicalHistory(new Request(url,{method:'POST',headers,body:JSON.stringify({mode:'reports',from:'2026-02-31'})}))).status,400);
  const pdfForm=await uploadForm('Original PDF');pdfForm.set('files',new File(['%PDF-1.7\nSynthetic original PDF bytes\n%%EOF'],'original.pdf',{type:'application/pdf'}));
  const pdf=await createMedicalReport(owner.id,pdfForm);
  const result=await downloadFile(patientRequest('http://localhost/api/file?preview=1',owner.id),{params:Promise.resolve({reportId:pdf.id,fileId:pdf.files[0].id})});
  assert.match(result.headers.get('content-disposition')!,/^attachment/);
  assert.equal(await result.text(),'%PDF-1.7\nSynthetic original PDF bytes\n%%EOF');
});


test('analytics document coordinates include scrolling and preview paths exclude private routes',()=>{
 assert.deepEqual(documentClick(200,300,0,1700,1000,4000),{x:.2,y:.5});
 assert.equal(analyticsPageKey('/faq','home'),'faq');assert.equal(analyticsPageKey('/blog/example','home'),'blog > example');assert.equal(analyticsPageKey('/','organ'),'organ');assert.equal(analyticsPageKey('/faq','profile'),'profile');
 assert.equal(analyticsPagePath('blog > %E6%B5%8B%E8%AF%95'),'/blog/%E6%B5%8B%E8%AF%95');assert.equal(analyticsPagePath('%61pi > users'),null);
 assert.equal(analyticsPagePath('home'),'/');assert.equal(analyticsPagePath('organ > registry'),'/organ/registry');
 for(const page of ['profile','admin-dashboard','api > users','//external.example','../private','dashboard > admin-login'])assert.equal(analyticsPagePath(page),null);
 assert.equal(ClickEventSchema.safeParse({page:'home',component:'Test',deviceType:'mobile',eventId:randomUUID()}).success,false);
});

const analyticsPost=(events:unknown[])=>new Request('http://localhost/api/analytics/clicks',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({events})});
const adminAnalyticsRequest=(path:string,role='ADMIN')=>new Request('http://localhost'+path,{headers:{authorization:'Bearer '+signToken({user_id:testAdminId,role})}});

test('unified clicks count once with matching coordinates under concurrent retry',integration,async()=>{
 const event={page:'unified-test',component:'Register',deviceType:'mobile',eventId:randomUUID(),sessionId:randomUUID(),clickX:.25,clickY:.75,viewportW:390,viewportH:844,documentW:390,documentH:4000,targetPath:'body > main:nth-of-type(1)',targetX:.5,targetY:.5};
 const responses=await Promise.all([collectClicks(analyticsPost([event])),collectClicks(analyticsPost([event]))]);assert.ok(responses.every(response=>response.status===200));
 assert.equal(await getPrisma().analyticsClickLog.count({where:{event_key:event.eventId}}),1);
 const points=await getPrisma().analyticsHeatmapLog.findMany({where:{event_key:event.eventId}});assert.equal(points.length,1);assert.equal(points[0].coordinate_space,'document');assert.equal(points[0].target_path,event.targetPath);
 const legacy={page:'legacy-count',component:'Original client',deviceType:'desktop'};assert.equal((await collectClicks(analyticsPost([legacy]))).status,200);
 assert.equal(await getPrisma().analyticsClickLog.count({where:{page:'legacy-count'}}),1);
 assert.equal(await getPrisma().analyticsHeatmapLog.count({where:{page:'legacy-count'}}),0);
});

test('analytics transaction rolls back the click count if heatmap storage fails',integration,async()=>{
 await sql.query(`ALTER TABLE "AnalyticsHeatmapLog" ADD CONSTRAINT test_atomic_analytics CHECK (page <> 'rollback-test') NOT VALID`);
 try{const response=await collectClicks(analyticsPost([{page:'rollback-test',component:'Test',deviceType:'desktop',eventId:randomUUID(),clickX:.2,clickY:.3,viewportW:1440,viewportH:900,documentW:1440,documentH:4000}]));assert.equal(response.status,500);assert.equal(await getPrisma().analyticsClickLog.count({where:{page:'rollback-test'}}),0);}finally{await sql.query('ALTER TABLE "AnalyticsHeatmapLog" DROP CONSTRAINT test_atomic_analytics');}
});

test('heatmap density covers all matching clicks, excludes scrolls, preserves legacy data and enforces roles',integration,async()=>{
 const db=getPrisma(),page='density-test';
 await db.analyticsClickLog.createMany({data:Array.from({length:2501},()=>({page,component:'Example',device_type:'desktop'}))});
 await db.analyticsHeatmapLog.createMany({data:Array.from({length:2500},(_,i)=>({page,device_type:'desktop',event_type:'click',coordinate_space:'document',click_x:(i%80)/80,click_y:(i%200)/200,session_id:'density-session'}))});
 await collectLegacyHeatmap(new Request('http://localhost/api/analytics/heatmap',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({events:[{page,deviceType:'desktop',eventType:'click',clickX:.3,clickY:.4},{page,deviceType:'desktop',eventType:'scroll',sessionId:'density-session',scrollDepth:25},{page,deviceType:'desktop',eventType:'scroll',sessionId:'density-session',scrollDepth:75}]})}));
 const response=await heatmapAnalytics(adminAnalyticsRequest('/api/admin/analytics/heatmap?page='+page+'&device=desktop&days=7&limit=50'));assert.equal(response.status,200);
 const payload=(await response.json()).data;assert.equal(payload.metrics.totalClicks,2501);assert.equal(payload.metrics.mappedClicks,2500);assert.equal(payload.points.reduce((n:any,p:any)=>n+p.weight,0),2500);assert.equal(payload.metrics.legacyPoints,1);assert.equal(payload.metrics.avgScrollDepth,75);assert.equal(payload.pageOptions.find((row:any)=>row.page===page).count,2501);
 assert.equal((await heatmapAnalytics(adminAnalyticsRequest('/api/admin/analytics/heatmap','USER'))).status,403);
 assert.equal((await heatmapAnalytics(new Request('http://localhost/api/admin/analytics/heatmap'))).status,401);
 const mobile=(await(await heatmapAnalytics(adminAnalyticsRequest('/api/admin/analytics/heatmap?page='+page+'&device=mobile&days=7'))).json()).data;assert.equal(mobile.metrics.totalClicks,0);assert.equal(mobile.metrics.mappedClicks,0);
 await db.analyticsClickLog.create({data:{page,component:'Historical interaction',device_type:'desktop',created_at:new Date('2020-01-01')}});
 await db.analyticsHeatmapLog.create({data:{page,device_type:'desktop',coordinate_space:'viewport',click_x:.2,click_y:.3,created_at:new Date('2020-01-01')}});
 const allTime=(await(await heatmapAnalytics(adminAnalyticsRequest('/api/admin/analytics/heatmap?page='+page+'&device=desktop&days=0'))).json()).data;assert.equal(allTime.metrics.totalClicks,2502);assert.equal(allTime.metrics.legacyPoints,2);assert.equal(allTime.metrics.mappedClicks,2500);

});

test('medical operations returns aggregate counts without patient content',integration,async()=>{
 const response=await medicalOperations(adminAnalyticsRequest('/api/admin/medical-operations'));assert.equal(response.status,200);assert.match(response.headers.get('cache-control')||'',/no-store/);
 const payload=await response.json();assert.equal(typeof payload.data.reports,'number');const text=JSON.stringify(payload);assert.ok(!text.includes('migration@example.invalid'));assert.ok(!text.includes('Legacy CBC'));assert.ok(!text.includes(migratedUserId));
 assert.equal((await medicalOperations(patientRequest('http://localhost/api/admin/medical-operations',migratedUserId))).status,403);
});


test('concurrent first policy reads preserve content and do not race on initialization',integration,async()=>{
 const values=await Promise.all(Array.from({length:8},()=>getSiteContent(getPrisma())));assert.equal(values.length,8);assert.ok(values.every(value=>Boolean(value.termsOfService)));const original=await getPrisma().policy.findMany({orderBy:{type:'asc'}});await getSiteContent(getPrisma());assert.deepEqual(await getPrisma().policy.findMany({orderBy:{type:'asc'}}),original);
});

test('new registrations lead All groups and every blood filter regardless of location or older profile edits', integration, async () => {
  const db = getPrisma(), prefix = `Newest-${randomUUID()}`;
  const groups = ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'];
  const start = Date.now() + 86_400_000;
  const expected: string[] = [];
  const older = await newPatient();
  await db.user.update({ where: { id: older.id }, data: { name: prefix + '-older-local', blood_group: 'O-', location_city: 'Delhi', location_country: 'India', verification_status: 'VERIFIED', created_at: new Date('2020-01-01'), updated_at: new Date(start + 999_999) } });
  const query = async (group?: string, cursor?: string, limit = 16, sort?: string) => {
    const params = new URLSearchParams({ search: prefix, viewerCity: 'Delhi', viewerCountry: 'India', limit: String(limit) });
    if (group) params.set('bloodGroup', group);
    if (cursor) params.set('cursor', cursor);
    if (sort) params.set('sort', sort);
    const response = await publicBloodDonors(new Request(`http://localhost/api/public/donors?${params}`));
    assert.equal(response.status, 200); assert.match(response.headers.get('cache-control') || '', /no-store/);
    return response.json();
  };
  for (const [index, group] of groups.entries()) {
    const user = await newPatient(); expected.unshift(user.id);
    await db.user.update({ where: { id: user.id }, data: { name: prefix + '-' + index, blood_group: group, created_at: new Date(start + index * 1000), location_city: 'Dhaka', location_country: 'Bangladesh' } });
    assert.equal((await query(group)).data[0].id, user.id);
    assert.equal((await query()).data[0].id, user.id);
  }
  await db.manualBloodDonor.create({ data: { name: prefix + '-manual', mobile: randomUUID(), blood_group: 'O-', location_city: 'Dhaka', location_country: 'Bangladesh', location_lat: 23.8, location_lng: 90.4, source: 'TEST', added_by_admin: 'TEST', created_at: new Date(start + 999_999) } });
  await db.communityDonor.create({ data: { organization_name: prefix + '-community', mobile: randomUUID(), location_city: 'Dhaka', location_country: 'Bangladesh', location_lat: 23.8, location_lng: 90.4, source: 'TEST', added_by_admin: 'TEST', created_at: new Date(start + 999_999) } });
  assert.deepEqual((await query()).data.slice(0, 8).map((row: { id: string }) => row.id), expected);
  const next = await newPatient();
  await db.user.update({ where: { id: next.id }, data: { name: prefix + '-next', blood_group: 'O-', created_at: new Date(start + 10_000) } });
  assert.deepEqual((await query('O-')).data.slice(0, 2).map((row: { id: string }) => row.id), [next.id, expected[0]]);
  assert.equal((await query('O-', undefined, 16, 'NEARBY')).data[0].id, older.id);
  const first = await query(undefined, undefined, 2), second = await query(undefined, first.pagination.nextCursor, 2);
  assert.equal(new Set([...first.data, ...second.data].map(row => row.id)).size, 4);
  // The ORM fallback must preserve the same registration order, too.
  await sql.query('ALTER TABLE "UserServiceCity" RENAME COLUMN created_at TO created_at_test_unavailable');
  try {
    const fallback = await query('O-'); assert.equal(fallback.meta.fallback, true);
    assert.deepEqual(fallback.data.slice(0, 2).map((row: { id: string }) => row.id), [next.id, expected[0]]);
  } finally { await sql.query('ALTER TABLE "UserServiceCity" RENAME COLUMN created_at_test_unavailable TO created_at'); }
});

test('SEO locations include active primary/service cities, correct country canonicals and marrow without private data', integration, async () => {
  const db = getPrisma(), marker = `Seo-${randomUUID()}`;
  const user = await newPatient();
  await db.user.update({ where:{id:user.id},data:{location_city:marker,location_country:'Bangladesh'} });
  await db.organPledge.create({data:{user_id:user.id,organ_type:'Bone Marrow'}});
  for (const [city,country] of [[marker,'Bangladesh'],[marker,'India']]) await db.userServiceCity.create({data:{user_id:user.id,city,country,formatted_location:`${city}, ${country}`,lat:1,lng:1,provider_place_id:randomUUID(),locked_until:new Date()}});
  const inactive=await newPatient();await db.user.update({where:{id:inactive.id},data:{is_active_donor:false,location_city:marker+'-inactive'}});
  const rows=await getDonorLocations(), primary=rows.find(row=>row.city===marker&&row.country==='Bangladesh')!, service=rows.find(row=>row.city===marker&&row.country==='India')!;
  assert.equal(primary.bloodCount,1);assert.equal(primary.organCount,1);assert.deepEqual(primary.organs,['Bone Marrow']);
  assert.equal(service.bloodCount,1);assert.equal(service.organCount,1);assert.ok(!rows.some(row=>row.city===marker+'-inactive'));
  const params={country:'india',city:toLocationSlug(marker)};
  assert.equal((await findDonorLocation(params.country,params.city))?.country,'India');
  const metadata=await donorLocationMetadata(params,'organ');
  assert.equal(metadata.alternates?.canonical,donorLocationPath(service,'organ'));assert.match(String(metadata.description),/Bone Marrow/);
  const missing=await donorLocationMetadata({country:'nowhere',city:'not-a-registered-city'},'blood');
  assert.deepEqual(missing.robots,{index:false,follow:true});
  const response=await locationSitemap();assert.equal(response.status,200);const xml=await response.text();
  assert.ok(xml.includes(donorLocationPath(primary,'blood')));assert.ok(xml.includes(donorLocationPath(service,'organ')));
  assert.ok(!xml.includes(marker+'-inactive'));assert.ok(!JSON.stringify(rows).includes(user.email));assert.ok(!JSON.stringify(rows).includes(user.profile_code));
  assert.ok((await getOrganTypesWithData()).includes('bone-marrow'));
});

test('admin, public feed, and server statistics share active donor counts across all sources', integration, async () => {
  const db = getPrisma();
  const baseline = await getActiveBloodDonorCounts();
  const patient = await newPatient();
  const location = { location_city: 'Count-Test', location_country: 'Bangladesh', location_lat: 1, location_lng: 1 };
  const manual = await db.manualBloodDonor.create({ data: { name: 'Count test', mobile: randomUUID(), blood_group: 'O-', ...location, source: 'TEST', added_by_admin: 'TEST' } });
  const community = await db.communityDonor.create({ data: { organization_name: randomUUID(), mobile: randomUUID(), ...location, source: 'TEST', added_by_admin: 'TEST' } });
  const inactive = await newPatient();
  await db.user.update({ where: { id: inactive.id }, data: { is_active_donor: false } });
  await db.manualBloodDonor.create({ data: { name: 'Inactive test', mobile: randomUUID(), blood_group: 'A+', ...location, is_active_donor: false, source: 'TEST', added_by_admin: 'TEST' } });
  await db.communityDonor.create({ data: { organization_name: randomUUID(), mobile: randomUUID(), ...location, is_active: false, source: 'TEST', added_by_admin: 'TEST' } });
  await db.userServiceCity.create({ data: { user_id: patient.id, city: 'Extra city', country: 'Bangladesh', formatted_location: 'Extra city', lat: 1, lng: 1, provider_place_id: randomUUID(), locked_until: new Date() } });
  const check = async (total: number) => {
    const response = await dashboardOverview(new Request('http://localhost/api/admin/dashboard-overview', { headers: { authorization: `Bearer ${signToken({ user_id: testAdminId, role: 'ADMIN' })}` } }));
    assert.equal(response.status, 200);
    assert.match(response.headers.get('cache-control') || '', /no-store/);
    const kpis = (await response.json()).data.kpis;
    assert.equal(kpis.totalActiveDonors, total);
    assert.equal(kpis.activeDonorSources.total, total);
    for (const suffix of ['', '?bloodGroup=O-', '?search=NoMatchingDonor']) {
      const feed = await publicBloodDonors(new Request('http://localhost/api/public/donors' + suffix));
      assert.equal(feed.status, 200);
      assert.equal((await feed.json()).meta.globalTotal, total, 'Filters must not change the global total');
    }
    assert.equal((await getPublicBotStats()).activeBloodDonors, total);
    for (const route of [siteState, platformStats]) {
      const stats = await route(); assert.equal(stats.status, 200);
      assert.match(stats.headers.get('cache-control') || '', /no-store/);
      const payload = await stats.json();
      assert.equal((payload.publicNetwork || payload.data.publicNetwork).activeBloodDonors, total);
    }
  };
  assert.deepEqual(await getActiveBloodDonorCounts(), { registered: baseline.registered + 1, manual: baseline.manual + 1, community: baseline.community + 1, total: baseline.total + 3 });
  await check(baseline.total + 3);
  await db.communityDonor.update({ where: { id: community.id }, data: { is_active: false } });
  await db.manualBloodDonor.update({ where: { id: manual.id }, data: { is_active_donor: false } });
  await db.user.update({ where: { id: patient.id }, data: { is_active_donor: false } });
  await check(baseline.total);
});

test('local donor lists isolate countries, preserve newest-first filters and use matching service locations', integration, async () => {
  const db = getPrisma(), marker = `Region-${randomUUID()}`;
  const groups = ['AB+', 'AB-', 'A+', 'A-', 'B+', 'B-', 'O+', 'O-'];
  const newest = new Map<string,string>();
  for (const country of ['India','Bangladesh']) {
    for (const [index,blood_group] of groups.entries()) {
      const donor = await newPatient();
      await db.user.update({where:{id:donor.id},data:{name:marker,blood_group,location_country:country,location_city:marker,created_at:new Date(Date.now()+index*1000)}});
      if (country==='India') newest.set(blood_group,donor.id);
      await db.organPledge.create({data:{user_id:donor.id,organ_type:'Bone Marrow'}});
    }
    const location = {location_country:country,location_city:marker,location_lat:1,location_lng:1};
    await db.manualBloodDonor.create({data:{name:marker,mobile:randomUUID(),blood_group:'O-',...location,source:'TEST',added_by_admin:'TEST'}});
    await db.communityDonor.create({data:{organization_name:marker+country,mobile:randomUUID(),...location,source:'TEST',added_by_admin:'TEST'}});
    await db.manualOrganDonor.create({data:{name:marker,mobile:randomUUID(),blood_group:'O-',organ_type:'Bone Marrow',...location,source:'TEST',added_by_admin:'TEST'}});
    await db.organRequest.create({data:{name:marker,contact:randomUUID(),organ_type:'Kidney',status:'VERIFIED',...location}});
  }
  const read = async (route:typeof publicBloodDonors, params:Record<string,string>) => {
    const response=await route(new Request('http://localhost/api/public/donors?'+new URLSearchParams({limit:'16',search:marker,...params})));
    assert.equal(response.status,200);return response.json();
  };
  for (const bloodGroup of groups) {
    const payload=await read(publicBloodDonors,{country:'India',bloodGroup});
    assert.equal(payload.data[0].id,newest.get(bloodGroup));
    assert.ok(payload.data.every(row=>row.location_country==='India'));
  }
  for (const country of ['India','Bangladesh']) {
    for (const route of [publicBloodDonors,publicOrganDonors]) {
      const payload=await read(route,{country});
      assert.ok(payload.data.length>0);
      assert.ok(payload.data.every(row=>row.location_country===country));
    }
    const requests=await publicOrganRequests(new Request('http://localhost/api/public/organ-requests?viewerCountry='+country));
    assert.equal(requests.status,200);assert.ok((await requests.json()).data.every(row=>row.location_country===country));
  }
  assert.equal((await read(publicBloodDonors,{country:'Nepal'})).data.length,0,'Empty local results cannot broaden to foreign donors');
  const first=await read(publicBloodDonors,{country:'India',limit:'2'});
  const second=await read(publicBloodDonors,{country:'India',limit:'2',cursor:first.pagination.nextCursor});
  assert.ok(second.data.every(row=>row.location_country==='India'));
  assert.equal(new Set([...first.data,...second.data].map(row=>row.id)).size,4);

  const traveler=await newPatient();
  await db.user.update({where:{id:traveler.id},data:{name:marker+'-service',location_country:'Bangladesh'}});
  await db.organPledge.create({data:{user_id:traveler.id,organ_type:'Kidney'}});
  for (const [city,country] of [['Dhaka','Bangladesh'],['Delhi','India']]) await db.userServiceCity.create({data:{user_id:traveler.id,city,country,formatted_location:city,lat:1,lng:1,provider_place_id:randomUUID(),locked_until:new Date()}});
  for (const route of [publicBloodDonors,publicOrganDonors]) {
    const local=await read(route,{country:'India',search:marker+'-service'});
    assert.equal(local.data.length,1);assert.equal(local.data[0].location_country,'India');assert.equal(local.data[0].location_city,'Delhi');
  }
  await sql.query('ALTER TABLE "UserServiceCity" RENAME COLUMN created_at TO created_at_test_unavailable');
  try {
    const fallback=await read(publicBloodDonors,{country:'India',search:marker+'-service'});
    assert.equal(fallback.meta.fallback,true);assert.equal(fallback.data.length,1);assert.equal(fallback.data[0].location_country,'India');
  } finally {await sql.query('ALTER TABLE "UserServiceCity" RENAME COLUMN created_at_test_unavailable TO created_at');}
});

test('visitor country lookup is uncached and never supplies a default country', async () => {
  for (const [code,country] of [['IN','India'],['BD','Bangladesh']]) {
    const result=await detectCountry(new Request('http://localhost/api/location/ip',{headers:{'cf-ipcountry':code}}));
    assert.equal(result.status,200);assert.equal((await result.json()).data.country,country);
    assert.match(result.headers.get('cache-control')||'',/no-store/);
  }
  assert.equal((await detectCountry(new Request('http://localhost/api/location/ip'))).status,404);
});

test('profile audit matches the patient profile and reads encrypted uploads without modifying patient records', integration, async () => {
  const db=getPrisma(),owner=await newPatient(),other=await newPatient();
  await db.userServiceCity.create({data:{user_id:owner.id,city:'Mumbai',country:'India',formatted_location:'Mumbai, India',lat:19,lng:72,provider_place_id:randomUUID(),locked_until:new Date()}});
  await db.user.update({where:{id:owner.id},data:{profile_image_url:'https://example.invalid/current-avatar.webp',health_data:{weight:68},is_active_donor:true}});
  const adminHeaders={authorization:`Bearer ${signToken({user_id:testAdminId,role:'ADMIN'})}`};
  const auditRequest=(path:string,method='GET',body?:string)=>new Request('http://localhost'+path,{method,headers:{...adminHeaders,...(body?{'Content-Type':'application/json'}:{})},...(body?{body}:{})});
  const context={params:Promise.resolve({userId:owner.id})};
  const admin=await auditProfile(auditRequest('/api/admin/users/'+owner.id),context);
  const patient=await selfProfile(patientRequest('http://localhost/api/users/me/profile',owner.id));
  const auditData=(await admin.json()).data,selfData=(await patient.json()).data;
  for(const field of ['profileCode','profileCodeNextChangeAt','name','profileImageUrl','healthData','activeOrgans','serviceCities']) assert.deepEqual(auditData[field],selfData[field],field);

  const captured=await sharp({create:{width:1200,height:1600,channels:3,background:'white'}}).jpeg({quality:100}).withMetadata().toBuffer();
  const saved=[];
  for(const mode of ['reports','prescriptions']) {
    const form=await uploadForm(mode==='reports'?'Audit CBC':'Audit prescription');
    form.append('files',new File([new Uint8Array(captured)],'camera-capture.jpg',{type:'image/jpeg'}));
    const result=await (mode==='reports'?uploadMedicalReport:uploadPrescription)(new Request('http://localhost/api/users/me/'+(mode==='reports'?'medical-reports':'prescriptions'),{method:'POST',headers:{authorization:`Bearer ${signToken({user_id:owner.id,role:'USER'})}`},body:form}));
    assert.equal(result.status,201);const report=(await result.json()).data;saved.push(report);
    const persisted=await db.medicalReport.findUniqueOrThrow({where:{id:report.id}});
    assert.ok(!Buffer.from(persisted.payload).includes(Buffer.from(report.title)));
    assert.equal(await db.medicalReportFile.count({where:{report_id:report.id}}),2);
    const body=JSON.stringify({mode});
    const audited=await auditHistory(auditRequest('/api/admin/history','POST',body),context);
    assert.equal(audited.status,200);assert.match(audited.headers.get('cache-control')||'',/no-store/);
    const own=await searchMedicalHistory(new Request('http://localhost/api/users/me/medical-records/history',{method:'POST',headers:{authorization:`Bearer ${signToken({user_id:owner.id,role:'USER'})}`,'Content-Type':'application/json'},body}));
    assert.deepEqual((await audited.json()).data,(await own.json()).data);
    for(const file of report.files) {
      const params={reportId:report.id,fileId:file.id};
      const auditDownload=await auditFile(auditRequest('/api/admin/file?preview=1'),{params:Promise.resolve({...params,userId:owner.id})});
      const ownDownload=await downloadFile(patientRequest('http://localhost/api/file?preview=1',owner.id),{params:Promise.resolve(params)});
      assert.equal(auditDownload.status,200);assert.equal(auditDownload.headers.get('content-type'),'image/webp');
      assert.deepEqual(Buffer.from(await auditDownload.arrayBuffer()),Buffer.from(await ownDownload.arrayBuffer()));
      assert.equal((await auditFile(auditRequest('/api/admin/file'),{params:Promise.resolve({...params,userId:other.id})})).status,404);
    }
  }
  const delivery=await acceptPrescription('doctor-portal',samplePrescription(owner.profile_code));
  const before=await db.prescription.findUniqueOrThrow({where:{id:delivery.id}});
  const auditedRx=await auditPrescription(auditRequest('/api/admin/prescription'),{params:Promise.resolve({userId:owner.id,prescriptionId:delivery.id})});
  assert.equal(auditedRx.status,200);
  const ownRx=await downloadPrescription(patientRequest('http://localhost/api/prescription',owner.id),{params:Promise.resolve({prescriptionId:delivery.id})});
  assert.equal(await auditedRx.text(),await ownRx.text());
  assert.deepEqual(await db.prescription.findUniqueOrThrow({where:{id:delivery.id}}),before,'An audit must not mark patient prescriptions read or change mail state');
  assert.equal((await auditHistory(new Request('http://localhost/api/admin/history',{method:'POST',body:'{}'}),context)).status,401);
  assert.equal((await auditHistory(patientRequest('http://localhost/api/admin/history',other.id,'POST'),context)).status,403);
  assert.equal((await auditHistory(new Request('http://localhost/api/admin/history',{method:'POST',headers:{...adminHeaders,origin:'https://foreign.invalid'},body:JSON.stringify({mode:'reports'})}),context)).status,403);
  assert.equal((await auditHistory(auditRequest('/api/admin/history','POST',JSON.stringify({mode:'reports'})),{params:Promise.resolve({userId:randomUUID()})})).status,404);
});

test('discovery falls back to real nearby donors without exposing coordinates or disturbing newest local order',integration,async()=>{
  const db=getPrisma(),near=await newPatient(),far=await newPatient();
  await db.user.update({where:{id:near.id},data:{name:'Nearest fixture',blood_group:'AB-',location_country:'India',location_lat:89.124,location_lng:170.123,created_at:new Date('2020-01-01')}});
  await db.user.update({where:{id:far.id},data:{name:'Far fixture',blood_group:'AB-',location_country:'India',location_lat:-80,location_lng:-100,created_at:new Date(Date.now()+10000)}});
  for(const user of [near,far])await db.organPledge.create({data:{user_id:user.id,organ_type:'Kidney'}});
  for(const [endpoint,route] of [['/api/public/donors',publicBloodDonors],['/api/public/organ-donors',publicOrganDonors]] as const) {
    const query=new URLSearchParams({country:'NoDonorsHere',bloodGroup:'AB-',viewerLat:'89.123',viewerLng:'170.123'});
    const fetcher=(async(input)=>route(new Request(new URL(String(input),'http://localhost')))) as typeof fetch;
    const result=await discoverDonors(endpoint,query,undefined,fetcher);
    assert.equal(result.payload.data[0].id,near.id);assert.equal(result.params.has('country'),false);
    assert.match(result.notice,/other locations/);assert.equal(result.payload.meta.fallback,undefined,'Normal SQL path must succeed');
    assert.ok(!JSON.stringify(result.payload.data).includes('internal_lat'));assert.ok(!JSON.stringify(result.payload.data).includes('internal_lng'));
  }
  const newest=await publicBloodDonors(new Request('http://localhost/api/public/donors?country=India&bloodGroup=AB-&sort=NEWEST&viewerLat=89.123&viewerLng=170.123'));
  assert.equal((await newest.json()).data[0].id,far.id,'Distance must not change newest-first local feeds');
});

test('automatic IP location uses the visitor address, deduplicates lookups, and skips private/VPS addresses',async()=>{
  const request=new Request('http://localhost/api/location/ip',{headers:{'x-real-ip':'8.8.4.4'}});
  assert.equal(publicClientIp(request),'8.8.4.4');
  assert.equal(publicClientIp(new Request('http://localhost',{headers:{'x-real-ip':'127.0.0.1'}})),null);
  assert.equal(publicClientIp(new Request('http://localhost')),null);
  const originalFetch=globalThis.fetch;let calls=0;
  globalThis.fetch=(async(input)=>{calls++;const url=new URL(String(input));assert.equal(url.hostname,'api.geoapify.com');assert.equal(url.searchParams.get('ip'),'8.8.4.4');return Response.json({country:{name:'India'},city:{name:'Delhi'},location:{latitude:28.61,longitude:77.2}});}) as typeof fetch;
  try {
    const [one,two]=await Promise.all([automaticIpLocation(request),automaticIpLocation(request)]);
    assert.equal(calls,1);assert.deepEqual(one,{country:'India',city:'Delhi',lat:28.61,lng:77.2});assert.deepEqual(one,two);
    assert.equal(await automaticIpLocation(new Request('http://localhost')),null);assert.equal(calls,1);
  }finally{globalThis.fetch=originalFetch;}
});


test('OTP storage is protected, legacy OTPs survive upgrade, and concurrent replay admits once', integration, async () => {
  const auth=new AuthService(),email=randomUUID()+'@example.invalid',otp=auth.generateOTP();
  assert.match(otp,/^[0-9]{6}$/);
  await auth.storeOTP(email,otp);
  const saved=await getPrisma().otpVerification.findUniqueOrThrow({where:{email}});
  assert.notEqual(saved.code,otp);assert.match(saved.code,/^hmac-sha256:/);
  assert.equal(await auth.verifyOTP(email,otp),true);
  assert.equal(await auth.verifyOTP(email,'000000'),false);
  const consumed=await Promise.all(Array.from({length:6},()=>auth.consumeOTP(email,otp)));
  assert.equal(consumed.filter(Boolean).length,1);
  await getPrisma().otpVerification.create({data:{email,code:otp,expires_at:new Date(Date.now()+60_000)}});
  assert.equal(await auth.verifyOTP(email,otp),true);
  assert.equal(await auth.consumeOTP(email,otp),true);
  await getPrisma().otpVerification.create({data:{email,code:otp,expires_at:new Date(Date.now()-60_000)}});
  assert.equal(await auth.consumeOTP(email,otp),false);
  assert.equal(await auth.verifyOTP(email,otp),false);
});

test('database rate limiting is atomic across concurrent requests and expires correctly', integration, async () => {
  const {securityRateLimit,securityDigest}=await import('../src/backend/utils/security');
  const key=randomUUID(),scope='integration-security';
  const results=await Promise.allSettled(Array.from({length:8},()=>securityRateLimit(scope,key,3,60_000)));
  assert.equal(results.filter(x=>x.status==='fulfilled').length,3);
  for(const result of results)if(result.status==='rejected')assert.equal(result.reason.status,429);
  await getPrisma().authRiskEvent.updateMany({where:{fingerprint_hash:securityDigest(scope+':'+key)},data:{created_at:new Date(Date.now()-120_000)}});
  await securityRateLimit(scope,key,3,60_000);
});

test('admin login upgrades legacy passwords and deleted or demoted admins lose API access immediately', integration, async () => {
  const {POST:login}=await import('../src/app/api/auth/admin/login/route');
  const bcrypt=await import('bcryptjs');
  const admin=await getPrisma().adminUser.create({data:{admin_id:randomUUID(),password:'legacy-test-password',role:'ADMIN'}});
  const response=await login(new Request('http://localhost/api/auth/admin/login',{method:'POST',headers:{'Content-Type':'application/json','X-Real-IP':'192.0.2.71'},body:JSON.stringify({adminId:admin.admin_id,password:'legacy-test-password'})}));
  assert.equal(response.status,200);assert.match(response.headers.get('set-cookie')||'',/Max-Age=28800/);
  const updated=await getPrisma().adminUser.findUniqueOrThrow({where:{id:admin.id}});
  assert.match(updated.password,/^\$2/);assert.equal(await bcrypt.compare('legacy-test-password',updated.password),true);
  const request=()=>new Request('http://localhost/api/admin/dashboard-overview',{headers:{authorization:'Bearer '+signToken({user_id:admin.id,role:'ADMIN'})}});
  assert.equal((await dashboardOverview(request())).status,200);
  await getPrisma().adminUser.update({where:{id:admin.id},data:{role:'MANAGER'}});
  assert.equal((await dashboardOverview(request())).status,401);
  await getPrisma().adminUser.delete({where:{id:admin.id}});
  assert.equal((await dashboardOverview(request())).status,401);
});

test('verification uploads are encrypted, owner-bound and privately readable by owner or active admin', integration, async () => {
  const {POST:upload}=await import('../src/app/api/uploads/image/route');
  const {GET:view}=await import('../src/app/api/uploads/image/[assetId]/route');
  const {POST:attach}=await import('../src/app/api/users/me/verification-documents/route');
  const {readStoredMedia}=await import('../src/backend/services/mediaStorage');
  const {unlink}=await import('node:fs/promises');
  const owner=await newPatient(),other=await newPatient();
  const image=await sharp({create:{width:40,height:30,channels:3,background:'white'}}).png().toBuffer();
  const makeRequest=(category:string,userId?:string)=>{
    const form=new FormData();form.append('category',category);form.append('file',new File([image],'test.png',{type:'image/png'}));
    return new Request('http://localhost/api/uploads/image',{method:'POST',headers:userId?{authorization:'Bearer '+signToken({user_id:userId,role:'USER'})}:{},body:form});
  };
  assert.equal((await upload(makeRequest('PROFILE'))).status,401);
  const response=await upload(makeRequest('VERIFICATION',owner.id));assert.equal(response.status,200);
  const payload=await response.json(),asset=await getPrisma().mediaAsset.findUniqueOrThrow({where:{id:payload.data.id}});
  try {
    assert.equal(payload.data.mimeType,'image/webp');assert.match(asset.public_url,/\/api\/uploads\/image\//);
    const encrypted=await readStoredMedia(asset.storage_key);assert.notEqual(encrypted.subarray(0,4).toString(),'RIFF');
    const params=Promise.resolve({assetId:asset.id});
    assert.equal((await view(new Request('http://localhost/image'),{params})).status,401);
    assert.equal((await view(patientRequest('http://localhost/image',other.id),{params})).status,404);
    const opened=await view(patientRequest('http://localhost/image',owner.id),{params});assert.equal(opened.status,200);
    assert.match(opened.headers.get('cache-control')||'',/no-store/);
    assert.equal((await sharp(Buffer.from(await opened.arrayBuffer())).metadata()).format,'webp');
    assert.equal((await view(adminAnalyticsRequest('/image'),{params})).status,200);
    const attachRequest=(userId:string)=>new Request('http://localhost/api/users/me/verification-documents',{method:'POST',headers:{authorization:'Bearer '+signToken({user_id:userId,role:'USER'}),'Content-Type':'application/json'},body:JSON.stringify({assetUrl:asset.public_url})});
    assert.equal((await attach(attachRequest(other.id))).status,400);
    assert.equal((await attach(attachRequest(owner.id))).status,200);
    const oversized=new Request('http://localhost/api/uploads/image',{method:'POST',headers:{'content-length':String(11*1024*1024)},body:'x'});
    assert.equal((await upload(oversized)).status,413);
  } finally {
    if(asset.storage_key.startsWith('local/'))await unlink(path.resolve('public/uploads',asset.storage_key.slice(6)));
  }
});


const authRequest=(path:string,payload:unknown)=>new Request('http://localhost/api/auth/otp/'+path,{method:'POST',headers:{'content-type':'application/json','x-real-ip':'192.0.2.119'},body:JSON.stringify(payload)});
const registrationPayload=(email:string,mobile:string)=>{const city={city:'Dhaka',country:'Bangladesh',formatted_location:'Dhaka, Bangladesh',latitude:23.81,longitude:90.41,provider_place_id:'registration-conflict-test'};return {mode:'register',email,mobile,otp:'123456',name:'Registration Test',dateOfBirth:'2000-01-01T00:00:00Z',bloodGroup:'O-',locations:[{...city,token:signLocationProof(city)}]};};

test('duplicate registration identities stop before OTP sending without changing accounts or pending codes',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');
 const {transporter}=await import('../src/backend/utils/mailer');
 const send=mock.method(transporter,'sendMail',async()=>({messageId:'test-only'}));
 try{
 const owner=await newPatient();await getPrisma().user.update({where:{id:owner.id},data:{mobile:'+8801712345678'}});
 const snapshot=await getPrisma().user.findUniqueOrThrow({where:{id:owner.id}});
 await new AuthService().storeOTP(owner.email,'123456');const pending=await getPrisma().otpVerification.findUniqueOrThrow({where:{email:owner.email}});
 for(const payload of [
  {email:randomUUID()+'@example.invalid',mobile:'+8801712345678',expected:'PHONE_ALREADY_REGISTERED'},
  {email:randomUUID()+'@example.invalid',mobile:'00880 1712-345678',expected:'PHONE_ALREADY_REGISTERED'},
 ]){const response=await AuthController.requestOtp(authRequest('request',{mode:'register',email:payload.email,mobile:payload.mobile}));assert.equal(response.status,409);const data=await response.json();assert.equal(data.code,payload.expected);assert.match(data.error,/already/);assert.equal(response.headers.get('set-cookie'),null);}
 assert.equal(send.mock.callCount(),0);
 assert.deepEqual(await getPrisma().user.findUniqueOrThrow({where:{id:owner.id}}),snapshot);
 assert.deepEqual(await getPrisma().otpVerification.findUniqueOrThrow({where:{email:owner.email}}),pending);
 }finally{send.mock.restore();}
});

test('registration email reuse opens the original account while duplicate phones remain a clear conflict',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');const owner=await newPatient();
 for(const field of ['email','phone']){
 const email=field==='email'?owner.email.toUpperCase():randomUUID()+'@example.invalid';
 await new AuthService().storeOTP(email,'123456');const response=await AuthController.verifyOtp(authRequest('verify',registrationPayload(email,owner.mobile)));
 if(field==='email'){assert.equal(response.status,200);assert.equal((await response.json()).user.id,owner.id);assert.equal(await new AuthService().verifyOTP(email,'123456'),false);}else{assert.equal(response.status,409);const body=await response.json();assert.equal(body.field,field);assert.match(body.error,/already/);assert.equal(response.headers.get('set-cookie'),null);assert.equal(await new AuthService().verifyOTP(email,'123456'),true);}
 }
});

test('existing users still receive login OTPs and log in case-insensitively without changing profile data',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');const {transporter}=await import('../src/backend/utils/mailer');const owner=await newPatient();const send=mock.method(transporter,'sendMail',async()=>({messageId:'test-only'}));
 try{
 const email=owner.email.toUpperCase();const requested=await AuthController.requestOtp(authRequest('request',{mode:'login',email}));assert.equal(requested.status,200);assert.equal(send.mock.callCount(),1);assert.equal((await requested.json()).message,'OTP dispatched successfully');
 await new AuthService().storeOTP(email,'123456');const response=await AuthController.verifyOtp(authRequest('verify',{mode:'login',email,otp:'123456'}));assert.equal(response.status,200);assert.equal((await response.json()).user.id,owner.id);assert.match(response.headers.get('set-cookie')||'',/bloodnet_session=/);
 assert.deepEqual(await getPrisma().user.findUniqueOrThrow({where:{id:owner.id}}),owner);
 }finally{send.mock.restore();}
});

test('unknown login emails are directed to registration without sending OTP',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');const email=randomUUID()+'@example.invalid';
 const response=await AuthController.requestOtp(authRequest('request',{mode:'login',email}));assert.equal(response.status,404);assert.equal((await response.json()).code,'ACCOUNT_NOT_FOUND');assert.equal(await getPrisma().otpVerification.findUnique({where:{email}}),null);
});

test('simultaneous registrations with one phone create one account and return one clear conflict',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');const emails=[randomUUID()+'@example.invalid',randomUUID()+'@example.invalid'],mobile='+8801812345678';
 for(const email of emails)await new AuthService().storeOTP(email,'123456');
 const responses=await Promise.all(emails.map(email=>AuthController.verifyOtp(authRequest('verify',registrationPayload(email,mobile)))));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal((await responses.find(r=>r.status===409)!.json()).code,'PHONE_ALREADY_REGISTERED');assert.equal(await getPrisma().user.count({where:{mobile}}),1);
});

test('case-variant registrations are serialized without rewriting existing email addresses',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');const email=randomUUID()+'@example.invalid';const emails=[email,email.toUpperCase()];for(const value of emails)await new AuthService().storeOTP(value,'123456');
 const responses=await Promise.all(emails.map((value,i)=>AuthController.verifyOtp(authRequest('verify',registrationPayload(value,'+880191234567'+i)))));
 assert.deepEqual(responses.map(r=>r.status).sort(),[200,409]);assert.equal((await responses.find(r=>r.status===409)!.json()).code,'EMAIL_ALREADY_REGISTERED');assert.equal(await getPrisma().user.count({where:{email:{equals:email,mode:'insensitive'}}}),1);
});


test('a new account completes request, OTP verification and profile session with the current registration contract',integration,async()=>{
 const {AuthController}=await import('../src/backend/controllers/AuthController');const {transporter}=await import('../src/backend/utils/mailer');const send=mock.method(transporter,'sendMail',async()=>({messageId:'test-only'}));
 try{
 const email=randomUUID()+'@example.invalid',mobile='+8801993456789';const requested=await AuthController.requestOtp(authRequest('request',{mode:'register',email,mobile}));assert.equal(requested.status,200);assert.equal(send.mock.callCount(),1);
 const args=send.mock.calls[0].arguments as unknown as Array<{html:string}>;const otp=args[0].html.match(/>\s*(\d{6})\s*</)?.[1];assert.ok(otp);
 const response=await AuthController.verifyOtp(authRequest('verify',{...registrationPayload(email,mobile),otp,phone:{country_name:'Bangladesh',country_code:'BD',dial_code:'+880',local_phone_number:'1993456789',full_phone_number:mobile}}));
 assert.equal(response.status,200);const data=await response.json();assert.match(response.headers.get('set-cookie')||'',/bloodnet_session=/);
 const stored=await getPrisma().user.findUniqueOrThrow({where:{email}});assert.equal(stored.id,data.user.id);assert.equal(stored.mobile,mobile);assert.equal(stored.phone_country_code,'BD');assert.equal(await getPrisma().userServiceCity.count({where:{user_id:stored.id}}),1);
 assert.equal(await getPrisma().otpVerification.findUnique({where:{email}}),null);
 }finally{send.mock.restore();}
});


test('public search profiles require separate consent, persist and withdraw without changing the account', integration, async()=>{
  const {getPublicDonorProfile,listPublicDonorProfiles,getPublicProfileSettings,savePublicProfileSettings}=await import('../src/backend/services/publicDonorProfiles');
  const user=await newPatient();
  const original=await getPrisma().user.findUniqueOrThrow({where:{id:user.id}});
  assert.deepEqual(await getPublicProfileSettings(user.id),{isPublished:false,showPhone:false,bio:'',publicPath:null,consentVersion:null});
  assert.equal(await getPrisma().publicDonorProfile.count({where:{user_id:user.id}}),0);
  const settings={isPublished:true,showPhone:false,bio:'I prefer to coordinate volunteering through an authorised hospital. Please confirm the collection arrangements and respect my availability.'};
  await assert.rejects(savePublicProfileSettings(user.id,settings),/confirm.*name/);
  await assert.rejects(savePublicProfileSettings(user.id,{...settings,bio:settings.bio+' Call +8801712345678.',consent:true}),/Keep phone numbers/);
  await assert.rejects(savePublicProfileSettings(user.id,{...settings,showPhone:true,consent:true}),/separately confirm/);
  await savePublicProfileSettings(user.id,{...settings,consent:true});
  const row=await getPrisma().publicDonorProfile.findUniqueOrThrow({where:{user_id:user.id}});
  const publicData=await getPublicDonorProfile(row.slug);assert.ok(publicData);assert.equal(publicData.phone,null);
  for(const field of ['email','user_id','health_data','profile_code','date_of_birth','medicalReports'])assert.ok(!(field in publicData));
  assert.ok((await listPublicDonorProfiles()).some(item=>item.slug===row.slug));
  await savePublicProfileSettings(user.id,{...settings,showPhone:true,phoneConsent:true});
  assert.equal((await getPublicDonorProfile(row.slug))?.phone,user.mobile);
  await savePublicProfileSettings(user.id,{...settings,isPublished:false});
  assert.equal(await getPublicDonorProfile(row.slug),null);
  assert.ok(!(await listPublicDonorProfiles()).some(item=>item.slug===row.slug));
  await assert.rejects(savePublicProfileSettings(user.id,settings),/confirm.*name/);
  await savePublicProfileSettings(user.id,{...settings,consent:true});
  await getPrisma().user.update({where:{id:user.id},data:{is_active_donor:false}});
  assert.equal(await getPublicDonorProfile(row.slug),null);
  await savePublicProfileSettings(user.id,{...settings,isPublished:false});
  await getPrisma().user.update({where:{id:user.id},data:{is_active_donor:true,updated_at:original.updated_at}});
  assert.deepEqual(await getPrisma().user.findUniqueOrThrow({where:{id:user.id}}),original);
});

test('public profile endpoints keep donor consent owner-only and admin audits read-only',integration,async()=>{
  const owner=await newPatient();const other=await newPatient();
  const {GET,PATCH}=await import('../src/app/api/users/me/public-profile/route');
  const {GET:audit}=await import('../src/app/api/admin/users/[userId]/public-profile/route');
  assert.equal((await GET(new Request('https://bloodnet.test/api/users/me/public-profile'))).status,401);
  const url='https://bloodnet.test/api/users/me/public-profile';
  const bad=new Request(url,{method:'PATCH',headers:{authorization:'Bearer '+signToken({user_id:owner.id,role:'USER'}),'Content-Type':'application/json'},body:JSON.stringify({userId:other.id,isPublished:true,showPhone:false,bio:'Attempted target injection'})});
  assert.equal((await PATCH(bad)).status,400);
  const req=new Request('https://bloodnet.test/api/admin/users/'+owner.id+'/public-profile',{headers:{authorization:'Bearer '+signToken({user_id:testAdminId,role:'ADMIN'})}});
  const result=await audit(req,{params:Promise.resolve({userId:owner.id})});assert.equal(result.status,200);assert.equal((await result.json()).data.isPublished,false);
  assert.equal((await audit(patientRequest(req.url,other.id),{params:Promise.resolve({userId:owner.id})})).status,403);
  assert.equal(await getPrisma().publicDonorProfile.count({where:{user_id:owner.id}}),0);
});

test('blood-group location counts deduplicate service cities and metadata excludes empty groups',integration,async()=>{
  const {getLocationBloodGroupCounts}=await import('../src/backend/services/donorLocations');
  const user=await newPatient();const city='SEO '+randomUUID().slice(0,8);
  await getPrisma().user.update({where:{id:user.id},data:{location_city:city,blood_group:'O-'}});
  await sql.query('INSERT INTO "UserServiceCity" (id,user_id,city,country,formatted_location,lat,lng,provider_place_id,locked_until) VALUES ($1,$2,$3,$4,$5,23.81,90.41,$6,NOW())',[randomUUID(),user.id,city,'Bangladesh',city+', Bangladesh',randomUUID()]);
  assert.equal((await getLocationBloodGroupCounts('Bangladesh',city))['O-'],1);
  assert.equal((await getLocationBloodGroupCounts('India',city))['O-'],undefined);
  const params={country:'bangladesh',city:toLocationSlug(city)};
  assert.match(String((await donorLocationMetadata(params,'blood','O-')).title),/O- Blood donors/);
  assert.deepEqual((await donorLocationMetadata(params,'blood','AB-')).robots,{index:false,follow:true});
});


test('admin-added emails log into the original account and removed addresses lose pending OTP access',integration,async()=>{
 const {changeLoginEmails,listLoginEmails}=await import('../src/backend/services/loginEmails');
 const {AuthController}=await import('../src/backend/controllers/AuthController');const {transporter}=await import('../src/backend/utils/mailer');const send=mock.method(transporter,'sendMail',async()=>({messageId:'synthetic-only'}));
 try{
 const owner=await newPatient(),other=await newPatient(),alias=randomUUID()+'@example.invalid';const before=await getPrisma().user.findUniqueOrThrow({where:{id:owner.id}});
 await changeLoginEmails(owner.id,{action:'add',email:' '+alias.toUpperCase()+' '},testAdminId);
 assert.equal((await listLoginEmails(owner.id)).emails.length,2);
 await assert.rejects(changeLoginEmails(other.id,{action:'add',email:alias},testAdminId),/another account/);
 const requested=await AuthController.requestOtp(authRequest('request',{mode:'register',email:alias,mobile:other.mobile}));assert.equal(requested.status,200);const notice=await requested.json();assert.equal(notice.existingAccount,true);assert.match(notice.message,/already has an account/);
 const args=send.mock.calls.at(-1)!.arguments as unknown as [{to:string;html:string}];assert.equal(args[0].to,alias);const otp=args[0].html.match(/>\s*(\d{6})\s*</)?.[1];assert.ok(otp);
 const response=await AuthController.verifyOtp(authRequest('verify',{...registrationPayload(alias,other.mobile),otp}));assert.equal(response.status,200);assert.equal((await response.json()).user.id,owner.id);
 assert.deepEqual(await getPrisma().user.findUniqueOrThrow({where:{id:owner.id}}),before);
 await new AuthService().storeOTP(alias,'123456');await changeLoginEmails(owner.id,{action:'remove',email:alias},testAdminId);
 assert.equal((await AuthController.verifyOtp(authRequest('verify',{email:alias,mode:'login',otp:'123456'}))).status,401);
 assert.equal((await AuthController.requestOtp(authRequest('request',{email:alias,mode:'login'}))).status,404);
 await assert.rejects(changeLoginEmails(owner.id,{action:'remove',email:owner.email},testAdminId),/at least one/);
 assert.ok(await getPrisma().authRiskEvent.findFirst({where:{user_id:owner.id,event_type:'ADMIN_LOGIN_EMAIL_CHANGED'}}));
 }finally{send.mock.restore();}
});

test('support can promote and remove a primary email while retaining account records and permissions',integration,async()=>{
 const {changeLoginEmails,listLoginEmails}=await import('../src/backend/services/loginEmails');
 const {GET,PATCH}=await import('../src/app/api/admin/users/[userId]/emails/route');
 const {PATCH:legacyPatch}=await import('../src/app/api/admin/users/[userId]/route');
 const owner=await newPatient(),other=await newPatient(),alias=randomUUID()+'@example.invalid',next=randomUUID()+'@example.invalid';
 const url='https://bloodnet.test/api/admin/users/'+owner.id+'/emails',ctx={params:Promise.resolve({userId:owner.id})};
 assert.equal((await GET(patientRequest(url,other.id),ctx)).status,403);
 const adminReq=(body:unknown)=>new Request(url,{method:'PATCH',headers:{'Content-Type':'application/json',authorization:'Bearer '+signToken({user_id:testAdminId,role:'ADMIN'})},body:JSON.stringify(body)});
 assert.equal((await PATCH(adminReq({action:'add',email:alias}),ctx)).status,200);
 assert.equal((await PATCH(adminReq({action:'primary',email:alias}),ctx)).status,200);
 assert.equal((await listLoginEmails(owner.id)).primaryEmail,alias);
 await changeLoginEmails(owner.id,{action:'remove',email:alias},testAdminId);
 assert.equal((await listLoginEmails(owner.id)).primaryEmail,owner.email);
 const collision=await legacyPatch(adminReq({email:other.email}),ctx);assert.equal(collision.status,409);
 assert.equal((await legacyPatch(adminReq({email:next}),ctx)).status,200);
 assert.equal((await listLoginEmails(owner.id)).primaryEmail,next);
 assert.equal(await new UserRepository().findByEmail(owner.email),null);
 assert.equal((await new UserRepository().findByEmail(next))?.id,owner.id);
 assert.equal((await getPrisma().user.findUniqueOrThrow({where:{id:owner.id}})).profile_code,owner.profile_code);
});


test('discovery visibility saves independently of ads and streams committed changes without polling',integration,async()=>{
 const {GET,PATCH}=await import('../src/app/api/admin/site-controls/route');const {GET:events}=await import('../src/app/api/public/ui-events/route');
 const {getUiControls}=await import('../src/backend/services/uiControls');const before=await getPrisma().platformSettings.findFirst({orderBy:[{updated_at:'desc'},{id:'desc'}]});
 const admin=(value:unknown)=>new Request('https://bloodnet.test/api/admin/site-controls',{method:'PATCH',headers:{authorization:'Bearer '+signToken({user_id:testAdminId,role:'ADMIN'}),'Content-Type':'application/json'},body:JSON.stringify(value)});
 assert.equal((await GET(patientRequest('https://bloodnet.test/api/admin/site-controls',migratedUserId))).status,403);
 assert.equal((await PATCH(admin({discoveryVisible:'false'}))).status,400);
 const signal=new AbortController();const stream=await events(new Request('https://bloodnet.test/api/public/ui-events',{signal:signal.signal}));assert.equal(stream.headers.get('X-Accel-Buffering'),'no');
 const reader=stream.body!.getReader(),decoder=new TextDecoder();let buffer='';
 const nextValue=async()=>{for(let i=0;i<15;i++){const read=await reader.read();buffer+=decoder.decode(read.value);const values=[...buffer.matchAll(/data: (.+)\n/g)].map(match=>JSON.parse(match[1]));if(values.length){buffer='';return values.at(-1);}}throw Error('Missing stream event');};
 try{
 await nextValue();assert.equal((await PATCH(admin({discoveryVisible:false}))).status,200);
 for(let i=0;i<3;i++){if((await nextValue()).discoveryVisible===false)break;if(i===2)assert.fail('Visibility did not stream');}
 assert.equal((await getUiControls()).discoveryVisible,false);
 assert.equal((await PATCH(admin({discoveryVisible:true}))).status,200);
 for(let i=0;i<3;i++){if((await nextValue()).discoveryVisible===true)break;if(i===2)assert.fail('Visibility did not return');}
 const after=await getPrisma().platformSettings.findFirst({orderBy:[{updated_at:'desc'},{id:'desc'}]});
 if(before){assert.equal(after?.ads_runtime_enabled,before.ads_runtime_enabled);assert.deepEqual(after?.ad_units_json,before.ad_units_json);assert.equal(after?.ui_theme,before.ui_theme);}
 }finally{signal.abort();await reader.cancel();}
});
