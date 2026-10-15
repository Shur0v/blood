import { withActiveAdmin } from '@/src/backend/utils/activeAdmin';
import { medicalAuditUser, medicalFailure } from '@/src/backend/utils/medicalPrivacy';
import { medicalHistoryResponse } from '@/src/backend/services/medicalRecordReads';

export const runtime = 'nodejs';
async function handlePOST(req: Request, {params}:{params:Promise<{userId:string}>}) {
  try {const {userId}=await params;return await medicalHistoryResponse(req,await medicalAuditUser(req,userId));}
  catch(error){return medicalFailure(error);}
}

export const POST = withActiveAdmin(handlePOST);
