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
  const url = new URL(req.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(url.searchParams.get('limit') || '20', 10) || 20));
  const skip = (page - 1) * limit;
  const search = (url.searchParams.get('search') || '').trim();
  const where = {
    is_active: true,
    ...(search
      ? {
          OR: [
            { organization_name: { contains: search, mode: 'insensitive' as const } },
            { contact_person: { contains: search, mode: 'insensitive' as const } },
            { location_city: { contains: search, mode: 'insensitive' as const } },
            { location_country: { contains: search, mode: 'insensitive' as const } },
            { mobile: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  };

  const [recent, total] = await Promise.all([
    getPrisma().communityDonor.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip,
      take: limit,
    }),
    getPrisma().communityDonor.count({
      where,
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: recent,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      search,
    },
  });
}

export async function DELETE(req: Request) {
  const auth = ensureAdminSession(req);
  if ('error' in auth) return auth.error;

  const url = new URL(req.url);
  const deleteAll = url.searchParams.get('all') === 'true';
  const id = url.searchParams.get('id');

  if (deleteAll) {
    const result = await getPrisma().communityDonor.deleteMany({
      where: { is_active: true },
    });
    return NextResponse.json({
      success: true,
      message: `Removed ${result.count} community donor record(s).`,
      data: { removedCount: result.count },
    });
  }

  if (!id) {
    return NextResponse.json({ success: false, message: 'Missing community donor id.' }, { status: 400 });
  }

  await getPrisma().communityDonor.delete({
    where: { id },
  });

  return NextResponse.json({ success: true, message: 'Community donor removed.' });
}
