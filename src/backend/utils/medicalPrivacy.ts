import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole, USER_ROLE } from './session';
import { getPublicBaseUrl } from '../config/env';
import { getPrisma } from '../config/db';

export class MedicalError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function medicalKey(): Buffer {
  const key = process.env.MEDICAL_RECORDS_ENCRYPTION_KEY || '';
  if (!/^[a-f0-9]{64}$/i.test(key)) throw new MedicalError('Private medical storage is not configured.', 503);
  return Buffer.from(key, 'hex');
}

export function encryptMedical(data: Uint8Array, context: string): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', medicalKey(), iv);
  cipher.setAAD(Buffer.from(context));
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
  return Buffer.concat([Buffer.from([1]), iv, cipher.getAuthTag(), encrypted]);
}

export function decryptMedical(data: Uint8Array, context: string): Buffer {
  const buffer = Buffer.from(data);
  if (buffer.length < 29 || buffer[0] !== 1) throw new MedicalError('Medical record could not be opened.', 500);
  const cipher = createDecipheriv('aes-256-gcm', medicalKey(), buffer.subarray(1, 13));
  cipher.setAAD(Buffer.from(context));
  cipher.setAuthTag(buffer.subarray(13, 29));
  return Buffer.concat([cipher.update(buffer.subarray(29)), cipher.final()]);
}

export function medicalUser(req: Request): string {
  const session = getSessionFromRequest(req);
  if (!session) throw new MedicalError('Unauthorized.', 401);
  if (session.role !== USER_ROLE) throw new MedicalError('Only the patient can access these records.', 403);
  medicalOrigin(req);
  return session.user_id;
}

function medicalOrigin(req: Request) {
  // Reject cross-origin cookie-based writes. Server clients can use existing bearer sessions.
  const origin = req.headers.get('origin');
  // TLS terminates at the VPS proxy, so req.url may be an internal HTTP URL.
  // Trust the configured public origin, never an arbitrary forwarded host header.
  const trustedOrigins = new Set([new URL(req.url).origin, new URL(getPublicBaseUrl()).origin]);
  if (!['GET', 'HEAD'].includes(req.method) && origin && !trustedOrigins.has(origin)) {
    throw new MedicalError('Cross-origin request rejected.', 403);
  }
}

// Separate audit access never impersonates the patient or grants patient writes.
export async function medicalAuditUser(req: Request, userId: string): Promise<string> {
  const session = getSessionFromRequest(req);
  if (!session) throw new MedicalError('Unauthorized.', 401);
  if (!hasRequiredRole(session, ADMIN_ROLES)) throw new MedicalError('Administrator access required.', 403);
  medicalOrigin(req);
  if (!await getPrisma().user.findUnique({where:{id:userId},select:{id:true}})) throw new MedicalError('User not found.',404);
  return userId;
}

export function medicalFailure(error: unknown) {
  return NextResponse.json({ success: false, message: error instanceof MedicalError ? error.message : 'Unable to process medical records.' },
    { status: error instanceof MedicalError ? error.status : 500, headers: { 'Cache-Control': 'private, no-store' } });
}

export const privateHeaders = { 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' };
