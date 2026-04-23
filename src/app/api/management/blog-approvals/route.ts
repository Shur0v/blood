import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED', 'DRAFT', 'ARCHIVED']).optional(),
  search: z.string().optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'PUBLISHED', 'DRAFT', 'ARCHIVED']),
});
const DeleteSchema = z.object({
  id: z.string().uuid(),
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
              { title: { contains: search, mode: 'insensitive' as const } },
              { content: { contains: search, mode: 'insensitive' as const } },
              { seo_title: { contains: search, mode: 'insensitive' as const } },
              { seo_desc: { contains: search, mode: 'insensitive' as const } },
              { author_id: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const prisma = getPrisma();
    const [rows, total] = await Promise.all([
      prisma.blog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.blog.count({ where }),
    ]);

    const authorIds = [...new Set(rows.map((row) => row.author_id))];
    const users = authorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, name: true },
        })
      : [];
    const authorMap = new Map(users.map((user) => [user.id, user.name]));

    const data = rows.map((row) => ({
      ...row,
      author_name: authorMap.get(row.author_id) || row.author_id || 'Unknown author',
    }));

    const pendingCount = await prisma.blog.count({
      where: {
        OR: [{ status: 'PENDING' }, { status: 'DRAFT' }],
      },
    });

    return NextResponse.json({
      success: true,
      data,
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
    return NextResponse.json({ success: false, message: 'Failed to load blogs.' }, { status: 500 });
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

    const updated = await getPrisma().blog.update({
      where: { id: parsed.data.id },
      data: {
        status: parsed.data.status,
        ...(parsed.data.status === 'PUBLISHED' ? { published_at: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update blog status.' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const authError = ensureManagerSession(req);
  if (authError) {
    return authError;
  }

  try {
    const parsed = DeleteSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid payload.' }, { status: 400 });
    }

    await getPrisma().blog.delete({
      where: { id: parsed.data.id },
    });

    return NextResponse.json({ success: true, message: 'Blog removed successfully.' });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to delete blog.' }, { status: 500 });
  }
}
