import { NextResponse } from 'next/server';
import { acceptPrescription, authorizePrescriptionProvider } from '@/src/backend/services/prescriptions';
import { getPrisma } from '@/src/backend/config/db';
import { medicalFailure, privateHeaders, MedicalError } from '@/src/backend/utils/medicalPrivacy';
import { boundedBody } from '@/src/backend/utils/boundedBody';

export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    const source = authorizePrescriptionProvider(req);
    const bytes = await boundedBody(req, 64 * 1024);
    let input: unknown;
    try { input = JSON.parse(Buffer.from(bytes).toString()); } catch { throw new MedicalError('Invalid JSON.'); }
    const accepted = await acceptPrescription(source, input);
    // The supervised worker delivers committed records without blocking this request on SMTP.
    const saved = await getPrisma().prescription.findUnique({ where: { id: accepted.id }, select: { email_status: true } });
    return NextResponse.json({ success: true, data: { ...accepted, emailStatus: saved?.email_status } },
      { status: accepted.duplicate ? 200 : 201, headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
