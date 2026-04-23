import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
});

const ensureAdminSession = (req: Request): NextResponse | null => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  }
  return null;
};

export async function GET(req: Request) {
  const authError = ensureAdminSession(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '20',
  });
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
  }

  const { page, limit } = parsed.data;
  const prisma = getPrisma();

  const [rows, total] = await Promise.all([
    prisma.authRiskEvent.findMany({
      orderBy: { created_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        User: {
          select: { id: true, name: true, email: true },
        },
      },
    }),
    prisma.authRiskEvent.count(),
  ]);

  const grouped = rows.map((row) => ({
    id: row.id,
    userId: row.user_id,
    userName: row.User?.name || 'Unknown',
    userEmail: row.User?.email || 'N/A',
    eventType: row.event_type,
    reason: row.reason,
    scoreDelta: row.score_delta,
    fingerprintHash: row.fingerprint_hash,
    ipHash: row.ip_hash,
    createdAt: row.created_at,
  }));

  return NextResponse.json({
    success: true,
    data: grouped,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}
