import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { medicalPrescriptionResponse } from '@/src/backend/services/medicalRecordReads';
import { medicalFailure, medicalUser, privateHeaders, MedicalError } from '@/src/backend/utils/medicalPrivacy';

export async function GET(req: Request, { params }: { params: Promise<{ prescriptionId: string }> }) {
  try {
    const userId = medicalUser(req);
    const { prescriptionId } = await params;
    return await medicalPrescriptionResponse(userId, prescriptionId);
  } catch (error) { return medicalFailure(error); }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ prescriptionId: string }> }) {
  try {
    const userId = medicalUser(req);
    const { prescriptionId } = await params;
    const result = await getPrisma().prescription.updateMany({ where: { id: prescriptionId, user_id: userId, read_at: null }, data: { read_at: new Date() } });
    if (!result.count && !await getPrisma().prescription.findFirst({ where: { id: prescriptionId, user_id: userId }, select: { id: true } })) throw new MedicalError('Prescription not found.', 404);
    return NextResponse.json({ success: true }, { headers: privateHeaders });
  } catch (error) { return medicalFailure(error); }
}
