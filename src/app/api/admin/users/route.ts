import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  search: z.string().optional(),
  country: z.string().optional(),
  city: z.string().optional(),
});

export async function GET(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '20',
      search: url.searchParams.get('search') || undefined,
      country: url.searchParams.get('country') || undefined,
      city: url.searchParams.get('city') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params' }, { status: 400 });
    }

    const { page, limit, search, country, city } = parsed.data;
    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
            { mobile: { contains: search, mode: 'insensitive' as const } },
            { location_city: { contains: search, mode: 'insensitive' as const } },
          ],
          ...(country ? { location_country: { equals: country, mode: 'insensitive' as const } } : {}),
          ...(city ? { location_city: { equals: city, mode: 'insensitive' as const } } : {}),
        }
      : {
          ...(country ? { location_country: { equals: country, mode: 'insensitive' as const } } : {}),
          ...(city ? { location_city: { equals: city, mode: 'insensitive' as const } } : {}),
        }
      ;

    const prisma = getPrisma();

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    const userIds = users.map((user) => user.id);
    const activePledges = userIds.length
      ? await prisma.organPledge.findMany({
          where: {
            user_id: { in: userIds },
            is_active: true,
          },
          select: { user_id: true },
        })
      : [];

    const pledgedUserIds = new Set(activePledges.map((pledge) => pledge.user_id));

    const usersWithFlags = users.map((user) => ({
      ...user,
      hasActiveOrganPledge: pledgedUserIds.has(user.id),
    }));

    return NextResponse.json({
      success: true,
      data: usersWithFlags,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch users.' }, { status: 500 });
  }
}
