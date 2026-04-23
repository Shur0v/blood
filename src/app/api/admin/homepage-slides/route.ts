import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { listHomepageSlides } from '@/src/backend/services/homepageSlides';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const SlideCreateSchema = z.object({
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

export async function GET(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const data = await listHomepageSlides(getPrisma(), { includeInactive: true });
    return NextResponse.json(
      { success: true, data },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          Pragma: 'no-cache',
          Expires: '0',
        },
      },
    );
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to load slides.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = ensureAdmin(req);
  if (!auth.ok) return auth.response;

  try {
    const parsed = SlideCreateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid slide payload.' }, { status: 400 });
    }

    const prisma = getPrisma();
    const maxOrder = await prisma.homepageSlider.aggregate({
      _max: { order: true },
    });

    const created = await prisma.homepageSlider.create({
      data: {
        title: parsed.data.title,
        description: parsed.data.description || null,
        image_url: parsed.data.image_url,
        status: parsed.data.status,
        order: (maxOrder._max.order ?? 0) + 1,
      },
    });

    return NextResponse.json({ success: true, data: created, message: 'Slide added successfully.' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, message: 'Failed to add slide.' }, { status: 500 });
  }
}

