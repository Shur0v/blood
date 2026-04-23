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

const toPriority = (message: string): 'High' | 'Medium' => {
  const normalized = (message || '').toLowerCase();
  if (/(fake|fraud|abuse|scam|spam|threat|urgent)/.test(normalized)) {
    return 'High';
  }
  return 'Medium';
};

const startOfUtcDay = (date: Date) => new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

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
    const todayStart = startOfUtcDay(new Date());

    const [rows, total, totalOpen, resolvedTodayRows, categoryRows] = await Promise.all([
      prisma.report.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.report.count({ where }),
      prisma.report.count({ where: { status: { not: 'RESOLVED' } } }),
      prisma.report.count({ where: { status: 'RESOLVED', created_at: { gte: todayStart } } }),
      prisma.report.findMany({
        select: { target_type: true },
      }),
    ]);

    const categoryCount = new Map<string, number>();
    for (const row of categoryRows) {
      const key = row.target_type;
      categoryCount.set(key, (categoryCount.get(key) ?? 0) + 1);
    }
    let topCategory = 'N/A';
    let topCount = 0;
    for (const [key, count] of categoryCount.entries()) {
      if (count > topCount) {
        topCount = count;
        topCategory = key.replace(/_/g, ' ');
      }
    }

    const mapped = rows.map((row) => ({
      id: row.id,
      reporterName: row.reporter_contact || (row.reporter_id ? `User ${row.reporter_id.slice(0, 8)}` : 'Guest'),
      reporterId: row.reporter_id ? `USR-${row.reporter_id.slice(0, 8)}` : 'GUEST',
      targetType: row.target_type,
      targetId: row.target_id,
      reason: row.target_type.replace(/_/g, ' '),
      preview: row.message,
      date: row.created_at,
      status: row.status,
      priority: toPriority(row.message),
      evidence: false,
    }));

    const highPriorityCount = mapped.filter((item) => item.priority === 'High').length;

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      meta: {
        totalOpen,
        resolvedToday: resolvedTodayRows,
        highPriority: highPriorityCount,
        topCategory,
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to fetch reports.' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const session = getSessionFromRequest(req);
  if (!session) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
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
