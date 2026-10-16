import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '../config/db';
import { boundedBody } from '../utils/boundedBody';
import { decryptMedical, MedicalError, privateHeaders } from '../utils/medicalPrivacy';
import { listMedicalTimeline } from './medicalReports';
import { decodePrescription, prescriptionHtml } from './prescriptions';
import type { MedicalReportDetails, MedicalDocument } from '@/src/lib/medicalRecords';

const HistoryQuery = z.object({mode:z.enum(['reports','prescriptions']),q:z.string().max(200).default(''),category:z.string().max(100).default(''),from:z.string().max(10).default(''),to:z.string().max(10).default(''),cursor:z.string().max(1000).optional(),verifyUpload:z.string().uuid().optional()}).strict();

export async function medicalHistoryResponse(req: Request, userId: string) {
  let input: unknown;
  try {input=JSON.parse(new TextDecoder().decode(await boundedBody(req,8192)));}
  catch(error) {if(error instanceof MedicalError)throw error;throw new MedicalError('Invalid history filters.');}
  const parsed=HistoryQuery.safeParse(input);
  if(!parsed.success)throw new MedicalError('Invalid history filters.');
  const {mode,verifyUpload,...filters}=parsed.data;
  let verifiedUpload:MedicalDocument|undefined;
  if(verifyUpload) {
    const record=await getPrisma().medicalReport.findFirst({where:{id:verifyUpload,user_id:userId,record_kind:mode==='prescriptions'?'PRESCRIPTION':'REPORT'},include:{Files:{select:{id:true,mime_type:true,size_bytes:true}}}});
    if(!record)throw new MedicalError('The upload could not be confirmed in this account. Keep your files and retry from the correct profile.',409);
    const details=JSON.parse(decryptMedical(record.payload,`report:${userId}:${record.id}`).toString()) as MedicalReportDetails;
    if(!details.files.length||details.files.length!==record.Files.length||details.files.some(file=>!record.Files.some(stored=>stored.id===file.id&&stored.mime_type===file.mimeType&&stored.size_bytes===file.sizeBytes)))throw new MedicalError('The saved attachments could not be confirmed. Keep your files and contact support.',500);
    verifiedUpload={...details,id:record.id,createdAt:record.created_at.toISOString(),kind:record.record_kind==='PRESCRIPTION'?'uploaded-prescription':'report'};
  }
  const params=new URLSearchParams(Object.entries(filters).filter((entry):entry is [string,string]=>typeof entry[1]==='string'));
  const [timeline,rows]=await Promise.all([listMedicalTimeline(userId,mode,params),getPrisma().$queryRaw<Array<{reports:bigint;prescriptions:bigint}>>`
    SELECT (SELECT COUNT(*) FROM "MedicalReport" WHERE user_id=${userId} AND record_kind='REPORT') AS reports,
      ((SELECT COUNT(*) FROM "MedicalReport" WHERE user_id=${userId} AND record_kind='PRESCRIPTION')+
       (SELECT COUNT(*) FROM "Prescription" WHERE user_id=${userId})) AS prescriptions
  `]);
  return NextResponse.json({success:true,data:{...timeline,counts:{reports:Number(rows[0].reports),prescriptions:Number(rows[0].prescriptions)},...(verifiedUpload?{verifiedUpload}:{})}},{headers:privateHeaders});
}

export async function medicalFileResponse(req: Request, userId: string, reportId: string, fileId: string) {
  const file=await getPrisma().medicalReportFile.findFirst({where:{id:fileId,report_id:reportId,Report:{user_id:userId}},include:{Report:{select:{payload:true}}}});
  if(!file)throw new MedicalError('File not found.',404);
  const details:MedicalReportDetails=JSON.parse(decryptMedical(file.Report.payload,`report:${userId}:${reportId}`).toString());
  const name=details.files.find(item=>item.id===fileId)?.name||'medical-report';
  const bytes=decryptMedical(file.payload,`report-file:${userId}:${fileId}`);
  const disposition=new URL(req.url).searchParams.get('preview')==='1'&&file.mime_type==='image/webp'?'inline':'attachment';
  return new Response(new Uint8Array(bytes),{headers:{...privateHeaders,'Content-Type':file.mime_type,
    'Content-Disposition':`${disposition}; filename="medical-report"; filename*=UTF-8''${encodeURIComponent(name)}`,
    'Content-Security-Policy':"sandbox; default-src 'none'",'Content-Length':String(bytes.length)}});
}

export async function medicalPrescriptionResponse(userId: string, prescriptionId: string) {
  const record=await getPrisma().prescription.findFirst({where:{id:prescriptionId,user_id:userId},include:{User:{select:{name:true}}}});
  if(!record)throw new MedicalError('Prescription not found.',404);
  return new Response(prescriptionHtml(decodePrescription(record),record.User.name),{headers:{...privateHeaders,
    'Content-Type':'text/html; charset=utf-8','Content-Disposition':'attachment; filename="prescription.html"',
    'Content-Security-Policy':"sandbox; default-src 'none'; style-src 'unsafe-inline'"}});
}
