import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED']).optional(),
  search: z.string().optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'UNDER_REVIEW', 'RESOLVED']),
});

const ensureManagerSession = (req: Request): NextResponse | null => {
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
  const authError = ensureManagerSession(req);
  if (authError) {
    return authError;
  }

  try {
    const url = new URL(req.url);
    const parsed = QuerySchema.safeParse({
      page: url.searchParams.get('page') || '1',
      limit: url.searchParams.get('limit') || '20',
      status: url.searchParams.get('status') || undefined,
      search: url.searchParams.get('search') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
    }

    const { page, limit, status, search } = parsed.data;
    const where = {
      ...(status ? { status } : {}),
      ...(search
        ? {
            OR: [
              { target_type: { contains: search, mode: 'insensitive' as const } },
              { target_id: { contains: search, mode: 'insensitive' as const } },
              { message: { contains: search, mode: 'insensitive' as const } },
              { reporter_contact: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const prisma = getPrisma();
    const [rows, total, pendingCount] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
      prisma.report.count({ where: { status: 'PENDING' } }),
    ]);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      meta: {
        pendingCount,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load reports.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const authError = ensureManagerSession(req);
  if (authError) {
    return authError;
  }

  try {
    const parsed = UpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    const updated = await getPrisma().report.update({
      where: { id: parsed.data.id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update report.' }, { status: 500 });
  }
}
