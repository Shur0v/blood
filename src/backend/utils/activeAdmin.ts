import { getPrisma } from '../config/db';
import { ADMIN_ROLES, getSessionFromRequest } from './session';
import { MedicalError, medicalFailure } from './medicalPrivacy';
import { matchesStaffCredential } from './staffCredential';

export async function requireActiveAdmin(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) throw new MedicalError('Unauthorized.', 401);
  if (!ADMIN_ROLES.includes(session.role as typeof ADMIN_ROLES[number])) throw new MedicalError('Forbidden.', 403);
  const admin = await getPrisma().adminUser.findUnique({ where: { id: session.user_id }, select: { role: true, password:true } });
  if (!admin || admin.role !== session.role || !matchesStaffCredential(session.credential_version,session.user_id,admin.password)) throw new MedicalError('Session expired. Please sign in again.', 401);
  if (new URL(req.url).pathname.startsWith('/api/admin/') && session.role !== 'ADMIN') throw new MedicalError('Administrator access required.',403);
  return session;
}

// Every privileged request checks current database membership and role.
export function withActiveAdmin<T extends unknown[]>(handler: (req: Request, ...args: T) => Promise<Response>) {
  return async (req: Request, ...args: T): Promise<Response> => {
    try { await requireActiveAdmin(req); return await handler(req, ...args); }
    catch (error) { return medicalFailure(error); }
  };
}
