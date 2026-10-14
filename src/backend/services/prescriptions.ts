import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { getPrisma } from '../config/db';
import { decryptMedical, encryptMedical, medicalKey, MedicalError } from '../utils/medicalPrivacy';
import { normalizeProfileCode, PROFILE_CODE_PATTERN } from '@/src/lib/profileIdentifier';
import type { PrescriptionDetails } from '@/src/lib/medicalRecords';

export const PrescriptionSchema = z.object({
  patientProfileId: z.string().transform(normalizeProfileCode).refine(value => PROFILE_CODE_PATTERN.test(value)),
  externalId: z.string().trim().min(1).max(128),
  patientConsent: z.literal(true),
  issuedAt: z.string().datetime({ offset: true }).refine(value => new Date(value).getTime() <= Date.now() + 5 * 60_000, 'Prescription date cannot be in the future.'),
  doctor: z.object({ name: z.string().trim().min(1).max(160), registrationNumber: z.string().trim().min(1).max(120),
    specialty: z.string().trim().max(160).optional(), clinic: z.string().trim().max(200).optional() }),
  diagnosis: z.string().trim().max(4000).optional(),
  medications: z.array(z.object({ name: z.string().trim().min(1).max(200), dose: z.string().trim().min(1).max(200),
    frequency: z.string().trim().min(1).max(200), duration: z.string().trim().min(1).max(200), instructions: z.string().trim().max(2000).optional() })).max(50),
  advice: z.string().trim().max(10000).optional(),
  followUp: z.string().trim().max(2000).optional(),
}).strict().refine(value => value.medications.length > 0 || Boolean(value.advice), 'Include medicines or clinical advice.');

export function authorizePrescriptionProvider(req: Request): string {
  const expected = process.env.DOCTOR_PRESCRIPTION_API_KEY || '';
  if (expected.length < 32) throw new MedicalError('Doctor integration is not configured.', 503);
  const supplied = req.headers.get('authorization')?.replace(/^Bearer /, '') || '';
  const hash = (value: string) => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(hash(expected), hash(supplied))) throw new MedicalError('Unauthorized.', 401);
  return process.env.DOCTOR_PRESCRIPTION_SOURCE?.trim() || 'doctor-portal';
}

export async function acceptPrescription(source: string, input: unknown) {
  medicalKey();
  const parsed = PrescriptionSchema.safeParse(input);
  if (!parsed.success) throw new MedicalError('Invalid prescription. Include the patient ID, consent, doctor registration, date, and complete prescription details.');
  const details = parsed.data;
  const requestHash = createHash('sha256').update(JSON.stringify(details)).digest('hex');
  const prisma = getPrisma();
  const existing = await prisma.prescription.findUnique({ where: { source_external_id: { source, external_id: details.externalId } } });
  if (existing) {
    if (existing.request_hash !== requestHash) throw new MedicalError('This external ID was already used for a different prescription.', 409);
    return { id: existing.id, duplicate: true };
  }
  try {
    return await prisma.$transaction(async (tx) => {
      const users = await tx.$queryRaw<Array<{ id: string }>>`SELECT id FROM "User" WHERE profile_code = ${details.patientProfileId} FOR UPDATE`;
      const user = users[0];
      if (!user) throw new MedicalError('No registered patient has this active profile ID.', 404);
      const id = randomUUID();
      await tx.prescription.create({ data: {
        id, user_id: user.id, recipient_code: details.patientProfileId, source,
        external_id: details.externalId, request_hash: requestHash,
        payload: encryptMedical(Buffer.from(JSON.stringify(details)), `prescription:${user.id}:${id}`), issued_at: new Date(details.issuedAt),
      } });
      return { id, duplicate: false };
    });
  } catch (error) {
    // A concurrent duplicate submission may have committed first.
    if ((error as { code?: string })?.code === 'P2002') {
      const saved = await prisma.prescription.findUnique({ where: { source_external_id: { source, external_id: details.externalId } } });
      if (saved?.request_hash === requestHash) return { id: saved.id, duplicate: true };
      throw new MedicalError('This external ID was already used for a different prescription.', 409);
    }
    throw error;
  }
}

export function decodePrescription(record: { id: string; user_id: string; payload: Uint8Array }): PrescriptionDetails {
  return JSON.parse(decryptMedical(record.payload, `prescription:${record.user_id}:${record.id}`).toString());
}

const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!));
export function prescriptionHtml(details: PrescriptionDetails, patientName: string) {
  const paragraph = (title: string, text?: string) => text ? `<h2>${title}</h2><p style="white-space:pre-wrap">${escapeHtml(text)}</p>` : '';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Prescription</title>
    <style>body{font:15px/1.7 system-ui,sans-serif;color:#0f172a;max-width:760px;margin:32px auto;padding:24px}h1{color:#be123c}h2{font-size:18px}table{width:100%;border-collapse:collapse}th,td{padding:10px;text-align:left;vertical-align:top;border:1px solid #e2e8f0;overflow-wrap:anywhere}small{color:#475569}@media print{body{margin:0}}</style></head><body>
    <h1>Medical prescription</h1><p><strong>${escapeHtml(patientName)}</strong> · Patient ID ${escapeHtml(details.patientProfileId)}<br>Issued: ${escapeHtml(details.issuedAt)}<br>Reference: ${escapeHtml(details.externalId)}</p>
    <h2>${escapeHtml(details.doctor.name)}</h2><p>Registration: ${escapeHtml(details.doctor.registrationNumber)}${details.doctor.specialty ? `<br>${escapeHtml(details.doctor.specialty)}` : ''}${details.doctor.clinic ? `<br>${escapeHtml(details.doctor.clinic)}` : ''}</p>
    ${paragraph('Diagnosis', details.diagnosis)}<h2>Medicines</h2><table><thead><tr><th>Medicine</th><th>Dose</th><th>Frequency</th><th>Duration</th></tr></thead><tbody>
    ${details.medications.map(med => `<tr><td>${escapeHtml(med.name)}${med.instructions ? `<br><small>${escapeHtml(med.instructions)}</small>` : ''}</td><td>${escapeHtml(med.dose)}</td><td>${escapeHtml(med.frequency)}</td><td>${escapeHtml(med.duration)}</td></tr>`).join('')}</tbody></table>
    ${paragraph('Advice', details.advice)}${paragraph('Follow-up', details.followUp)}<p><small>Delivered by BloodNet on behalf of your clinician.</small></p></body></html>`;
}

export async function deliverPrescriptionEmail(id: string) {
  const prisma = getPrisma();
  const now = new Date();
  const claimed = await prisma.prescription.updateMany({ where: { id, email_status: { not: 'SENT' },
    email_next_attempt_at: { lte: now }, OR: [{ email_locked_until: null }, { email_locked_until: { lt: now } }] },
    data: { email_status: 'SENDING', email_locked_until: new Date(now.getTime() + 5 * 60_000), email_attempts: { increment: 1 } } });
  if (!claimed.count) return;
  const record = await prisma.prescription.findUnique({ where: { id }, include: { User: { select: { email: true, name: true } } } });
  if (!record) return;
  try {
    const details = decodePrescription(record);
    const { transporter } = await import('../utils/mailer');
    const html = prescriptionHtml(details, record.User.name);
    await transporter.sendMail({ from: `"BloodNet" <${process.env.SMTP_USER}>`, to: record.User.email,
      subject: 'Your medical prescription is available', messageId: `<prescription-${record.id}@bloodnet.live>`, html,
      text: `Your prescription is attached and available in your BloodNet medical profile. Doctor: ${details.doctor.name}. Reference: ${details.externalId}.`,
      attachments: [{ filename: 'prescription.html', content: html, contentType: 'text/html' }],
    });
    await prisma.prescription.update({ where: { id }, data: { email_status: 'SENT', email_sent_at: new Date(), email_locked_until: null } });
  } catch {
    await prisma.prescription.update({ where: { id }, data: { email_status: 'RETRY', email_locked_until: null,
      email_next_attempt_at: new Date(Date.now() + Math.min(24 * 60 * 60_000, 60_000 * 2 ** Math.min(record.email_attempts, 10))) } });
  }
}

export async function flushPrescriptionEmails(limit = 20) {
  const now = new Date();
  const records = await getPrisma().prescription.findMany({ where: { email_status: { not: 'SENT' },
    email_next_attempt_at: { lte: now }, OR: [{ email_locked_until: null }, { email_locked_until: { lt: now } }] },
    orderBy: { email_next_attempt_at: 'asc' }, take: limit, select: { id: true } });
  for (const record of records) await deliverPrescriptionEmail(record.id);
  return records.length;
}
