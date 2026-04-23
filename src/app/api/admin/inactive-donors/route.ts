import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  search: z.string().optional(),
  reason: z.enum(['ALL', 'MISSING_VERIFICATION', 'USER_TURNED_OFF']).default('ALL'),
});

type InactiveReason = 'MISSING_VERIFICATION' | 'USER_TURNED_OFF';

const deriveReason = (verificationStatus: string): InactiveReason => {
  if (verificationStatus !== 'VERIFIED') return 'MISSING_VERIFICATION';
  return 'USER_TURNED_OFF';
};

const reasonLabel = (reason: InactiveReason): string =>
  reason === 'MISSING_VERIFICATION' ? 'Missing Verification' : 'User Turned Off Availability';

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
      reason: url.searchParams.get('reason') || 'ALL',
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params' }, { status: 400 });
    }

    const { page, limit, search, reason } = parsed.data;
    const prisma = getPrisma();
    const skip = (page - 1) * limit;

    const where = {
      is_active_donor: false,
      ...(search?.trim()
        ? {
            OR: [
              { name: { contains: search.trim(), mode: 'insensitive' as const } },
              { email: { contains: search.trim(), mode: 'insensitive' as const } },
              { mobile: { contains: search.trim(), mode: 'insensitive' as const } },
              { location_city: { contains: search.trim(), mode: 'insensitive' as const } },
              { location_country: { contains: search.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
      ...(reason === 'MISSING_VERIFICATION'
        ? { verification_status: { not: 'VERIFIED' } }
        : reason === 'USER_TURNED_OFF'
          ? { verification_status: 'VERIFIED' }
          : {}),
    };

    const [rows, total, totalInactive, verifiedInactive] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { updated_at: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          blood_group: true,
          location_city: true,
          location_country: true,
          verification_status: true,
          updated_at: true,
        },
      }),
      prisma.user.count({ where }),
      prisma.user.count({ where: { is_active_donor: false } }),
      prisma.user.count({ where: { is_active_donor: false, verification_status: 'VERIFIED' } }),
    ]);

    const rowIds = rows.map((row) => row.id);
    const [organPledges, missingVerificationCount, turnedOffCount] = await Promise.all([
      rowIds.length
        ? prisma.organPledge.groupBy({
            by: ['user_id'],
            where: {
              user_id: { in: rowIds },
              is_active: true,
            },
            _count: { _all: true },
          })
        : Promise.resolve([]),
      prisma.user.count({ where: { is_active_donor: false, verification_status: { not: 'VERIFIED' } } }),
      prisma.user.count({ where: { is_active_donor: false, verification_status: 'VERIFIED' } }),
    ]);

    const organMap = new Map(organPledges.map((row) => [row.user_id, row._count._all]));
    const withOrganRegistry = await prisma.user.count({
      where: {
        is_active_donor: false,
        OrganPledge: {
          some: { is_active: true },
        },
      },
    });

    const mapped = rows.map((row) => {
      const reasonCode = deriveReason(row.verification_status);
      return {
        id: row.id,
        name: row.name,
        bloodGroup: row.blood_group,
        location: `${row.location_city}, ${row.location_country}`,
        email: row.email,
        reasonCode,
        reasonLabel: reasonLabel(reasonCode),
        lastActive: row.updated_at,
        verificationStatus: row.verification_status,
        hasOrganRegistry: (organMap.get(row.id) ?? 0) > 0,
      };
    });

    const topReasonCode: InactiveReason =
      missingVerificationCount >= turnedOffCount ? 'MISSING_VERIFICATION' : 'USER_TURNED_OFF';

    return NextResponse.json({
      success: true,
      data: mapped,
      meta: {
        totalInactive,
        verifiedInactive,
        withOrganRegistry,
        topReason: reasonLabel(topReasonCode),
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load inactive donors.' }, { status: 500 });
  }
}
