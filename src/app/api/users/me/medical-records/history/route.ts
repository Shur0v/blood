import { medicalHistoryResponse } from '@/src/backend/services/medicalRecordReads';
import { medicalUser, medicalFailure } from '@/src/backend/utils/medicalPrivacy';

export const runtime = 'nodejs';
// Medical search terms stay out of URLs, browser history, and ordinary access logs.
export async function POST(req: Request) {
  try {
    return await medicalHistoryResponse(req, medicalUser(req));
  } catch(error) {return medicalFailure(error);}
}
