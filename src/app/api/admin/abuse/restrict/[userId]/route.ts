import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const ensureAdminSession = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { error: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }) };
  }
  return { session };
};

export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) return auth.error;

  const resolved = await params;
  const userId = resolved.userId;
  if (!userId) {
    return NextResponse.json({ success: false, message: 'User id required.' }, { status: 400 });
  }

  const prisma = getPrisma();
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
  }

  const recentRisk = await prisma.authRiskEvent.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });

  await prisma.restrictedIdentity.create({
    data: {
      user_id: userId,
      fingerprint_hash: recentRisk?.fingerprint_hash ?? null,
      ip_hash: recentRisk?.ip_hash ?? null,
      reason: 'Restricted by admin from Spam & Abuse Monitor.',
      is_active: true,
      created_by_admin: auth.session.user_id,
    },
  });

  return NextResponse.json({ success: true, message: 'User restricted successfully.' });
}
