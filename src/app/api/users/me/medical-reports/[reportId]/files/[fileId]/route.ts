import { getPrisma } from '@/src/backend/config/db';
import { decryptMedical, medicalUser, medicalFailure, privateHeaders, MedicalError } from '@/src/backend/utils/medicalPrivacy';
import type { MedicalReportDetails } from '@/src/lib/medicalRecords';

export const runtime = 'nodejs';
export async function GET(req: Request, { params }: { params: Promise<{ reportId: string; fileId: string }> }) {
  try {
    const userId = medicalUser(req);
    const { reportId, fileId } = await params;
    const file = await getPrisma().medicalReportFile.findFirst({
      where: { id: fileId, report_id: reportId, Report: { user_id: userId } }, include: { Report: { select: { payload: true } } },
    });
    if (!file) throw new MedicalError('File not found.', 404);
    const details: MedicalReportDetails = JSON.parse(decryptMedical(file.Report.payload, `report:${userId}:${reportId}`).toString());
    const name = details.files.find(item => item.id === fileId)?.name || 'medical-report';
    const bytes = decryptMedical(file.payload, `report-file:${userId}:${fileId}`);
    const disposition = new URL(req.url).searchParams.get('preview') === '1' && file.mime_type === 'image/webp' ? 'inline' : 'attachment';
    return new Response(new Uint8Array(bytes), { headers: { ...privateHeaders, 'Content-Type': file.mime_type,
      'Content-Disposition': `${disposition}; filename="medical-report"; filename*=UTF-8''${encodeURIComponent(name)}`,
      'Content-Security-Policy': "sandbox; default-src 'none'", 'Content-Length': String(bytes.length) } });
  } catch (error) { return medicalFailure(error); }
}
