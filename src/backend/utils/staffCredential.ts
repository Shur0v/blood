import { createHmac, timingSafeEqual } from 'node:crypto';

// Bound to both identity and stored password hash. Rotation invalidates existing sessions.
export function staffCredentialVersion(id: string, passwordHash: string) {
  const key = process.env.JWT_SECRET;
  if (!key || key.length < 32) throw new Error('Authentication is not configured.');
  return createHmac('sha256', key).update(`${id}\0${passwordHash}`).digest('hex');
}
export function matchesStaffCredential(version: string | undefined, id: string, passwordHash: string) {
  if (!version || !/^[a-f0-9]{64}$/.test(version)) return false;
  return timingSafeEqual(Buffer.from(version, 'hex'), Buffer.from(staffCredentialVersion(id, passwordHash), 'hex'));
}
