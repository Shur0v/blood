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

export async function GET(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) return auth.error;

  const recent = await getPrisma().communityDonor.findMany({
    where: { is_active: true },
    orderBy: { created_at: 'desc' },
    take: 20,
  });

  return NextResponse.json({ success: true, data: recent });
}

export async function DELETE(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing community donor id.' }, { status: 400 });
  }

  await getPrisma().communityDonor.update({
    where: { id },
    data: { is_active: false },
  });

  return NextResponse.json({ success: true, message: 'Community donor removed.' });
}
