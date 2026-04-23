import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  search: z.string().optional(),
});

const UpdateSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']),
  rejectionReason: z.string().optional(),
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
      ...(status ? { review_status: status } : {}),
      ...(search
        ? {
            OR: [
              { document_type: { contains: search, mode: 'insensitive' as const } },
              { asset_url: { contains: search, mode: 'insensitive' as const } },
              { user_id: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const prisma = getPrisma();
    const [rows, total, pendingCount] = await Promise.all([
      prisma.verificationDocument.findMany({
        where,
        include: {
          User: {
            select: {
              id: true,
              name: true,
              blood_group: true,
              location_city: true,
              location_country: true,
              email: true,
              mobile: true,
              verification_status: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.verificationDocument.count({ where }),
      prisma.verificationDocument.count({ where: { review_status: 'PENDING' } }),
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
    return NextResponse.json({ success: false, message: 'Failed to load verification requests.' }, { status: 500 });
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

    const document = await getPrisma().verificationDocument.findUnique({
      where: { id: parsed.data.id },
      select: { id: true, user_id: true },
    });

    if (!document) {
      return NextResponse.json({ success: false, message: 'Verification document not found.' }, { status: 404 });
    }

    const prisma = getPrisma();
    const [updatedDoc] = await prisma.$transaction([
      prisma.verificationDocument.update({
        where: { id: parsed.data.id },
        data: {
          review_status: parsed.data.status,
          rejection_reason: parsed.data.status === 'REJECTED' ? parsed.data.rejectionReason || 'Rejected by moderator' : null,
        },
      }),
      prisma.user.update({
        where: { id: document.user_id },
        data: {
          verification_status:
            parsed.data.status === 'APPROVED'
              ? 'VERIFIED'
              : parsed.data.status === 'REJECTED'
                ? 'UNVERIFIED'
                : 'PENDING',
        },
      }),
    ]);

    return NextResponse.json({ success: true, data: updatedDoc });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to update verification request.' }, { status: 500 });
  }
}
