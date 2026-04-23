import { NextResponse } from 'next/server';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';

const SlideUpdateSchema = z.object({
  title: z.string().trim().min(2).max(140),
  description: z.string().trim().max(500).optional().default(''),
  image_url: z.string().trim().url(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

const ensureAdmin = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (!hasRequiredRole(session, ADMIN_ROLES)) {
    return { ok: false as const, response: NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true as const };
};

export async function PUT(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = SlideUpdateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid slide payload.' }, { status: 400 });
    }

    const { id } = await context.params;
    const updated = await getPrisma().homepageSlider.update({
      where: { id },
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        image_url: parsed.data.image_url,
        status: parsed.data.status,
      },
    });

    return NextResponse.json({ success: true, data: updated, message: 'Slide updated successfully.' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Slide not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to update slide.' }, { status: 500 });
  }
}

export async function DELETE(req: Request, context: { params: Promise<{ id: string }> }) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const { id } = await context.params;
    await getPrisma().homepageSlider.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Slide deleted.' });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ success: false, message: 'Slide not found.' }, { status: 404 });
    }
    return NextResponse.json({ success: false, message: 'Failed to delete slide.' }, { status: 500 });
  }
}

