import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, USER_ROLE } from '@/src/backend/utils/session';
import { countWords, slugify } from '@/src/backend/utils/slug';

const CreateUserBlogSchema = z.object({
  title: z.string().min(5).max(180),
  content: z.string().min(20),
  isAnonymous: z.boolean().default(false),
});

const ensureUserSession = (req: Request) => {
  const session = getSessionFromRequest(req);
  if (!session) {
    return { error: NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 }) };
  }
  if (ADMIN_ROLES.includes(session.role as (typeof ADMIN_ROLES)[number])) {
    return { error: NextResponse.json({ success: false, message: 'Forbidden for admin session' }, { status: 403 }) };
  }
  if (session.role !== USER_ROLE) {
    return { error: NextResponse.json({ success: false, message: 'Invalid session role' }, { status: 403 }) };
  }
  return { session };
};

const ensureUniqueSlug = async (requested: string) => {
  const prisma = getPrisma();
  const base = slugify(requested) || `story-${Date.now()}`;
  let attempt = base;
  let i = 1;
  while (true) {
    const existing = await prisma.blog.findFirst({
      where: { slug: attempt },
      select: { id: true },
    });
    if (!existing) return attempt;
    i += 1;
    attempt = `${base}-${i}`;
  }
};

export async function POST(req: Request) {
  const auth = ensureUserSession(req);
  if ('error' in auth) {
    return auth.error;
  }

  try {
    const parsed = CreateUserBlogSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid story payload.' }, { status: 400 });
    }

    const payload = parsed.data;
    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: auth.session.user_id },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const finalSlug = await ensureUniqueSlug(payload.title);
    const row = await prisma.blog.create({
      data: {
        title: payload.title,
        content: payload.content,
        author_id: user.id,
        author_type: 'USER',
        is_anonymous: payload.isAnonymous,
        status: 'PENDING',
        slug: finalSlug,
        word_count: countWords(payload.content),
        published_at: null,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: row,
      message: 'Story submitted for review.',
    });
  } catch {
    return NextResponse.json({ success: false, message: 'Failed to submit story.' }, { status: 500 });
  }
}

