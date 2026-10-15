import { medicalFileResponse } from '@/src/backend/services/medicalRecordReads';
import { medicalUser, medicalFailure } from '@/src/backend/utils/medicalPrivacy';

export const runtime = 'nodejs';
export async function GET(req: Request, { params }: { params: Promise<{ reportId: string; fileId: string }> }) {
  try {
    const userId = medicalUser(req);
    const { reportId, fileId } = await params;
    return await medicalFileResponse(req, userId, reportId, fileId);
  } catch (error) { return medicalFailure(error); }
}
