import { createHash, randomUUID } from 'node:crypto';
import sharp from 'sharp';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '../config/db';
import { encryptMedical, decryptMedical, medicalKey, MedicalError } from '../utils/medicalPrivacy';
import { decodePrescription } from './prescriptions';
import { MAX_MEDICAL_FILE_BYTES, MAX_MEDICAL_TOTAL_BYTES, MAX_MEDICAL_FILES, REPORT_CATEGORIES, type MedicalReportDetails, type MedicalTimelineItem } from '@/src/lib/medicalRecords';

const validDate = (value: string) => {
  const date = new Date(`${value}T00:00:00Z`);
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
};
const pastDate = z.string().refine(value => validDate(value) && new Date(`${value}T00:00:00Z`) <= new Date(), 'Use a valid date, not in the future.');
const optionalDate = z.string().default('').refine(value => !value || validDate(value), 'Use a valid calendar date.');
export const ReportSchema = z.object({
  title: z.string().trim().min(2).max(160),
  category: z.enum([...REPORT_CATEGORIES, 'Prescription']),
  reportDate: pastDate,
  facility: z.string().trim().max(200),
  clinician: z.string().trim().max(160).default(''),
  notes: z.string().trim().max(10000).default(''),
  testName: z.string().trim().max(200).default(''),
  referenceNumber: z.string().trim().max(120).default(''),
  sampleType: z.string().trim().max(120).default(''),
  sampleCollectedOn: optionalDate.refine(value => !value || new Date(`${value}T00:00:00Z`) <= new Date(), 'Sample collection cannot be in the future.'),
  bodySite: z.string().trim().max(160).default(''),
  reason: z.string().trim().max(2000).default(''),
  findings: z.string().trim().max(10000).default(''),
  impression: z.string().trim().max(4000).default(''),
  followUpDate: optionalDate,
  doctorSpecialty: z.string().trim().max(160).default(''),
  doctorRegistration: z.string().trim().max(120).default(''),
  results: z.array(z.object({test:z.string().trim().min(1).max(160),value:z.string().trim().min(1).max(300),unit:z.string().trim().max(80).default(''),referenceRange:z.string().trim().max(200).default(''),flag:z.enum(['','Normal','High','Low','See report']).default('')})).max(100).default([]),
}).superRefine((value, ctx) => {
  if (value.category === 'Prescription' && !value.clinician) ctx.addIssue({code:'custom',path:['clinician'],message:'Enter the prescribing doctor name.'});
  if (value.category !== 'Prescription' && !value.facility) ctx.addIssue({code:'custom',path:['facility'],message:'Enter the hospital or laboratory.'});
  if (value.sampleCollectedOn && value.sampleCollectedOn > value.reportDate) ctx.addIssue({code:'custom',path:['sampleCollectedOn'],message:'Sample collection must be on or before the report date.'});
});

export function isMedicalFileSignature(buffer: Buffer, mime: string) {
  if (mime === 'application/pdf') return buffer.subarray(0,5).toString() === '%PDF-';
  if (mime === 'image/png') return buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (mime === 'image/jpeg') return buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  if (mime === 'image/webp') return buffer.subarray(0,4).toString() === 'RIFF' && buffer.subarray(8,12).toString() === 'WEBP';
  return false;
}

export async function optimizeMedicalImage(buffer: Buffer) {
  const metadata = await sharp(buffer, {limitInputPixels:40_000_000}).metadata();
  if ((metadata.pages || 1) > 1) throw new MedicalError('Upload image pages separately, or use a PDF for a multi-page document.');
  // Larger than public verification images: retain fine document text. Never upscale.
  const {data,info} = await sharp(buffer, {limitInputPixels:40_000_000,animated:false}).rotate()
    .resize({width:2400,height:3200,fit:'inside',withoutEnlargement:true})
    .webp({quality:90,effort:5,smartSubsample:true}).toBuffer({resolveWithObject:true});
  return {data,width:info.width,height:info.height};
}

export async function createMedicalReport(userId: string, form: FormData, kind: 'REPORT' | 'PRESCRIPTION' = 'REPORT') {
  medicalKey();
  const fields = ['title','category','reportDate','facility','clinician','notes','testName','referenceNumber','sampleType','sampleCollectedOn','bodySite','reason','findings','impression','followUpDate','doctorSpecialty','doctorRegistration'];
  let results: unknown = [];
  try { if (form.get('results')) results = JSON.parse(String(form.get('results'))); } catch { throw new MedicalError('Invalid test results.'); }
  const input = Object.fromEntries(fields.map(key => [key,form.get(key) || '']));
  if (kind === 'PRESCRIPTION') input.category = 'Prescription';
  else if (input.category === 'Prescription') throw new MedicalError('Upload prescriptions in the Prescriptions section.');
  const parsed = ReportSchema.safeParse({...input,results});
  if (!parsed.success) throw new MedicalError(parsed.error.issues[0]?.message || 'Invalid record details.');
  const files = form.getAll('files');
  if (!files.length || files.length > MAX_MEDICAL_FILES || files.some(file => !(file instanceof File))) throw new MedicalError('Attach one to five PDF, JPG, PNG, or WEBP files per record.');
  const typed = files as File[];
  if (typed.some(file => !file.size || file.size > MAX_MEDICAL_FILE_BYTES) || typed.reduce((sum,file)=>sum+file.size,0)>MAX_MEDICAL_TOTAL_BYTES) throw new MedicalError('Files must be up to 10 MB each and 20 MB per record.',413);
  const uploadKey = String(form.get('uploadKey') || '');
  if (uploadKey && !z.string().uuid().safeParse(uploadKey).success) throw new MedicalError('Invalid upload identifier.');
  const buffers = [] as Array<{file:File;buffer:Buffer}>;
  const hash = createHash('sha256').update(JSON.stringify({kind,...parsed.data}));
  for (const file of typed) {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!isMedicalFileSignature(buffer,file.type)) throw new MedicalError('File content must match an allowed PDF or image format.');
    buffers.push({file,buffer}); hash.update(JSON.stringify([file.name,file.type,buffer.length])); hash.update(buffer);
  }
  const requestHash = hash.digest('hex');
  const prisma = getPrisma();
  const retry = async () => {
    if (!uploadKey) return null;
    const previous = await prisma.medicalReport.findUnique({where:{user_id_upload_key:{user_id:userId,upload_key:uploadKey}}});
    if (!previous) return null;
    if (previous.request_hash !== requestHash) throw new MedicalError('This upload was already saved with different content. Start a new entry.',409);
    return {id:previous.id,kind:previous.record_kind==='PRESCRIPTION'?'uploaded-prescription' as const:'report' as const,createdAt:previous.created_at.toISOString(),...JSON.parse(decryptMedical(previous.payload,`report:${userId}:${previous.id}`).toString()) as MedicalReportDetails};
  };
  const previous = await retry(); if (previous) return previous;
  const id = randomUUID(), attachments = [], fileNames: MedicalReportDetails['files'] = [];
  for (const {file,buffer:original} of buffers) {
    let buffer = original, mime = file.type, dimensions: {width:number;height:number} | undefined;
    if (mime.startsWith('image/')) {
      try {const image = await optimizeMedicalImage(buffer);buffer=image.data;dimensions={width:image.width,height:image.height};mime='image/webp';}
      catch {throw new MedicalError('An image is invalid or too large to decode. Choose a JPG, PNG, or WEBP image.');}
    }
    const fileId = randomUUID();
    let name = file.name.replace(/[\x00-\x1f/\\]/g,'_').slice(0,180) || 'medical-document';
    if (mime === 'image/webp') name = name.replace(/\.[^.]*$/,'')+'.webp';
    fileNames.push({id:fileId,name,mimeType:mime,sizeBytes:buffer.length,originalBytes:original.length,...dimensions});
    attachments.push({id:fileId,mime_type:mime,size_bytes:buffer.length,payload:encryptMedical(buffer,`report-file:${userId}:${fileId}`)});
  }
  const details: MedicalReportDetails = {...parsed.data,files:fileNames};
  let createdAt:Date;
  try {const stored=await prisma.medicalReport.create({data:{id,user_id:userId,record_kind:kind,record_date:new Date(`${details.reportDate}T00:00:00Z`),upload_key:uploadKey||null,request_hash:requestHash,payload:encryptMedical(Buffer.from(JSON.stringify(details)),`report:${userId}:${id}`),Files:{create:attachments}}});createdAt=stored.created_at;}
  catch(error) {if ((error as {code?:string}).code==='P2002') {const duplicate=await retry();if(duplicate)return duplicate;}throw error;}
  return {id,...details,createdAt:createdAt.toISOString(),kind:kind==='PRESCRIPTION'?'uploaded-prescription' as const:'report' as const};
}

async function backfillDates(userId: string) {
  const prisma = getPrisma();
  while (true) {
    const rows = await prisma.medicalReport.findMany({where:{user_id:userId,record_date:null},select:{id:true,payload:true,created_at:true},take:100});
    if (!rows.length) return;
    await prisma.$transaction(rows.map(row => {
      const details = JSON.parse(decryptMedical(row.payload,`report:${userId}:${row.id}`).toString()) as MedicalReportDetails;
      const day = validDate(details.reportDate) ? details.reportDate : row.created_at.toISOString().slice(0,10);
      return prisma.medicalReport.updateMany({where:{id:row.id,user_id:userId,record_date:null},data:{record_date:new Date(`${day}T00:00:00Z`)}});
    }));
  }
}

type TimelineRow = {id:string;source:'DOCUMENT'|'DOCTOR';event_at:Date;created_at:Date;payload:Uint8Array;record_kind:string;read_at:Date|null;email_status:string|null};
const CursorSchema = z.object({date:z.string().datetime(),id:z.string().min(1).max(100),source:z.enum(['DOCUMENT','DOCTOR'])});
const encodeCursor = (row: TimelineRow) => Buffer.from(JSON.stringify({date:row.event_at.toISOString(),id:row.id,source:row.source})).toString('base64url');
export async function listMedicalTimeline(userId:string, mode:'reports'|'prescriptions', params = new URLSearchParams()) {
  await backfillDates(userId);
  const q=(params.get('q')||'').trim().toLowerCase().slice(0,200), category=params.get('category')||'';
  const from=params.get('from')||'',to=params.get('to')||'';
  if ((from&&!validDate(from))||(to&&!validDate(to))||(from&&to&&from>to)) throw new MedicalError('Use a valid date range.');
  let cursor: z.infer<typeof CursorSchema> | null = null;
  if (params.get('cursor')) {
    try {const value=params.get('cursor')!;if(value.length>1000)throw Error();cursor=CursorSchema.parse(JSON.parse(Buffer.from(value,'base64url').toString()));}
    catch {
      // Existing report clients used UUID cursors before the dated timeline.
      const legacy=params.get('cursor')!;
      const record=mode==='reports'&&z.string().uuid().safeParse(legacy).success
        ? await getPrisma().medicalReport.findFirst({where:{id:legacy,user_id:userId,record_kind:'REPORT'},select:{id:true,record_date:true}}):null;
      if(!record?.record_date)throw new MedicalError('Invalid history cursor.');
      cursor={id:record.id,date:record.record_date.toISOString(),source:'DOCUMENT'};
    }
  }
  const items: MedicalTimelineItem[] = [];
  let last:TimelineRow|undefined, lastReturned:TimelineRow|undefined, more=false, scanned=0;
  const recordKind=mode==='reports'?'REPORT':'PRESCRIPTION';
  while(items.length<21 && scanned<500) {
    const seek=cursor?Prisma.sql`AND (event_at,id,source) < (${new Date(cursor.date)}::timestamp,${cursor.id},${cursor.source})`:Prisma.empty;
    const start=from?Prisma.sql`AND event_at >= ${new Date(`${from}T00:00:00Z`)}::timestamp`:Prisma.empty;
    const end=to?Prisma.sql`AND event_at < ${new Date(new Date(`${to}T00:00:00Z`).getTime()+86400000)}::timestamp`:Prisma.empty;
    const rows=await getPrisma().$queryRaw<TimelineRow[]>(Prisma.sql`
      SELECT * FROM (
        SELECT id,'DOCUMENT'::text AS source,record_date::timestamp AS event_at,created_at,payload,record_kind,NULL::timestamp AS read_at,NULL::text AS email_status
        FROM "MedicalReport" WHERE user_id=${userId} AND record_kind=${recordKind}
        UNION ALL
        SELECT id,'DOCTOR'::text AS source,issued_at AS event_at,created_at,payload,'PRESCRIPTION'::text AS record_kind,read_at,email_status
        FROM "Prescription" WHERE user_id=${userId} AND ${mode==='prescriptions'}
      ) history WHERE true ${seek} ${start} ${end} ORDER BY event_at DESC,id DESC,source DESC LIMIT 50`);
    more=rows.length===50;
    for(const row of rows) {
      scanned++;last=row;
      const item: MedicalTimelineItem = row.source==='DOCTOR'
        ? {...decodePrescription({...row,user_id:userId}),id:row.id,kind:'doctor-prescription',createdAt:row.created_at.toISOString(),readAt:row.read_at?.toISOString()||null,emailStatus:row.email_status||'PENDING'}
        : {...JSON.parse(decryptMedical(row.payload,`report:${userId}:${row.id}`).toString()) as MedicalReportDetails,id:row.id,kind:mode==='reports'?'report':'uploaded-prescription',createdAt:row.created_at.toISOString()};
      if(category && (item.kind==='doctor-prescription'?'Prescription':item.category)!==category)continue;
      if(q&&!JSON.stringify(item).toLowerCase().includes(q))continue;
      if(items.length===20)return {items,nextCursor:encodeCursor(lastReturned!)};
      items.push(item);lastReturned=row;
    }
    if(!more)break;
    if(last)cursor={date:last.event_at.toISOString(),id:last.id,source:last.source};
  }
  return {items,nextCursor:more&&last?encodeCursor(last):null};
}

export async function listMedicalReports(userId:string,cursor?:string|null) {
  const params=new URLSearchParams();if(cursor)params.set('cursor',cursor);
  return listMedicalTimeline(userId,'reports',params);
}
