import { before, after, test } from 'node:test';
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
  assert.equal(await getPrisma().prescription.count({where:{user_id:owner.id}}),0,'Uploads must not enter the doctor email queue.');
  await acceptPrescription('doctor-portal',samplePrescription(owner.profile_code));
  const timeline=await listMedicalTimeline(owner.id,'prescriptions');assert.equal(timeline.items.length,2);
  assert.equal(timeline.items[0].kind,'doctor-prescription');assert.equal(timeline.items[1].kind,'uploaded-prescription');
  assert.equal((await listMedicalTimeline(owner.id,'reports')).items.length,0);
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
const adminAnalyticsRequest=(path:string,role='ADMIN')=>new Request('http://localhost'+path,{headers:{authorization:'Bearer '+signToken({user_id:randomUUID(),role})}});

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
