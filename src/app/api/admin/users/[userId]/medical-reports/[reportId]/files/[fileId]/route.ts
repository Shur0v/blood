import { medicalAuditUser, medicalFailure } from '@/src/backend/utils/medicalPrivacy';
import { medicalFileResponse } from '@/src/backend/services/medicalRecordReads';

export const runtime = 'nodejs';
export async function GET(req: Request, {params}:{params:Promise<{userId:string;reportId:string;fileId:string}>}) {
  try {const {userId,reportId,fileId}=await params;return await medicalFileResponse(req,await medicalAuditUser(req,userId),reportId,fileId);}
  catch(error){return medicalFailure(error);}
}
