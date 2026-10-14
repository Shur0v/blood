import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { decodePrescription } from '@/src/backend/services/prescriptions';
import { medicalFailure, medicalUser, privateHeaders } from '@/src/backend/utils/medicalPrivacy';
import { MedicalError } from '@/src/backend/utils/medicalPrivacy';
import { boundedBody } from '@/src/backend/utils/boundedBody';
import { createMedicalReport, listMedicalTimeline } from '@/src/backend/services/medicalReports';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  try {
    const userId = medicalUser(req);
    if (new URL(req.url).searchParams.get('timeline') === '1') {
      return NextResponse.json({success:true,data:await listMedicalTimeline(userId,'prescriptions',new URL(req.url).searchParams)}, {headers:privateHeaders});
    }
    const cursor = new URL(req.url).searchParams.get('cursor');
    const rows = await getPrisma().prescription.findMany({ where: { user_id: userId },
      ...(cursor && { cursor: { id: cursor }, skip: 1 }), orderBy: [{ created_at: 'desc' }, { id: 'desc' }], take: 21 });
    return NextResponse.json({ success: true, data: { items: rows.slice(0,20).map(row => ({ id: row.id,
      createdAt: row.created_at, readAt: row.read_at, emailStatus: row.email_status, ...decodePrescription(row) })),
      nextCursor: rows.length > 20 ? rows[19].id : null } }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}

export async function POST(req: Request) {
  try {
    const userId = medicalUser(req);
    if (Number(req.headers.get('content-length')) > 21*1024*1024) throw new MedicalError('Upload exceeds 20 MB.',413);
    const bytes = await boundedBody(req,21*1024*1024);
    const form = await new Response(bytes as BodyInit,{headers:{'Content-Type':req.headers.get('content-type')||''}}).formData();
    return NextResponse.json({success:true,data:await createMedicalReport(userId,form,'PRESCRIPTION')},{status:201,headers:privateHeaders});
  } catch(error) {return medicalFailure(error);}
}
