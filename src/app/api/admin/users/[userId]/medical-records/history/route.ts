import { medicalAuditUser, medicalFailure } from '@/src/backend/utils/medicalPrivacy';
import { medicalHistoryResponse } from '@/src/backend/services/medicalRecordReads';

export const runtime = 'nodejs';
export async function POST(req: Request, {params}:{params:Promise<{userId:string}>}) {
  try {const {userId}=await params;return await medicalHistoryResponse(req,await medicalAuditUser(req,userId));}
  catch(error){return medicalFailure(error);}
}
