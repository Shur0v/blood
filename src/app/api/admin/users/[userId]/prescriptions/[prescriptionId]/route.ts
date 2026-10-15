import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { medicalAuditUser, medicalFailure } from '@/src/backend/utils/medicalPrivacy';
import { medicalPrescriptionResponse } from '@/src/backend/services/medicalRecordReads';

export const runtime = 'nodejs';
async function handleGET(req: Request, {params}:{params:Promise<{userId:string;prescriptionId:string}>}) {
  try {const {userId,prescriptionId}=await params;return await medicalPrescriptionResponse(await medicalAuditUser(req,userId),prescriptionId);}
  catch(error){return medicalFailure(error);}
}

export const GET = withActiveAdmin(handleGET);
