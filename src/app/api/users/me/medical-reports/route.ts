import { NextResponse } from 'next/server';
import { createMedicalReport, listMedicalTimeline } from '@/src/backend/services/medicalReports';
import { medicalUser, medicalFailure, privateHeaders, MedicalError } from '@/src/backend/utils/medicalPrivacy';
import { boundedBody } from '@/src/backend/utils/boundedBody';

export const runtime = 'nodejs';
export async function GET(req: Request) {
  try {
    const data = await listMedicalTimeline(medicalUser(req), 'reports', new URL(req.url).searchParams);
    return NextResponse.json({ success: true, data }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
export async function POST(req: Request) {
  try {
    const userId = medicalUser(req);
    if (Number(req.headers.get('content-length')) > 21 * 1024 * 1024) throw new MedicalError('Upload exceeds 20 MB.', 413);
    const bytes = await boundedBody(req, 21 * 1024 * 1024);
    const form = await new Response(bytes as BodyInit, { headers: { 'Content-Type': req.headers.get('content-type') || '' } }).formData();
    const data = await createMedicalReport(userId, form);
    return NextResponse.json({ success: true, data }, { status: 201, headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
