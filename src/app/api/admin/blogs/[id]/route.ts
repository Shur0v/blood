import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { countWords, slugify } from '@/src/backend/utils/slug';

const UpdateBlogSchema = z.object({
  title: z.string().min(5).max(180).optional(),
  content: z.string().min(100).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  slug: z.string().min(3).max(180).optional(),
  canonicalUrl: z.string().url().nullable().optional(),
  metaTitle: z.string().max(180).nullable().optional(),
  metaDescription: z.string().max(320).nullable().optional(),
  primaryKeyword: z.string().max(120).nullable().optional(),
  secondaryKeywords: z.array(z.string().max(120)).optional(),
  minWordCount: z.number().int().min(300).max(3000).default(1200),
});

const ensureAdminSession = (req: Request): NextResponse | null => {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!hasRequiredRole(session, ADMIN_ROLES)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  return null;
};

const ensureUniqueSlug = async (requested: string, excludeId: string) => {
  const prisma = getPrisma();
  const base = slugify(requested) || `post-${Date.now()}`;
  let attempt = base;
  let i = 1;
  while (true) {
    const existing = await prisma.blog.findFirst({
      where: {
        slug: attempt,
        NOT: { id: excludeId },
      },
      select: { id: true },
    });
    if (!existing) return attempt;
    i += 1;
    attempt = `${base}-${i}`;
  }
};

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = ensureAdminSession(req);
  if (authError) return authError;

  const resolved = await params;
  const id = resolved.id;

  const parsed = UpdateBlogSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid blog payload.' }, { status: 400 });
  }

  const payload = parsed.data;
  const prisma = getPrisma();
  const existing = await prisma.blog.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ success: false, message: 'Blog not found.' }, { status: 404 });
  }

  const nextTitle = payload.title ?? existing.title;
  const nextContent = payload.content ?? existing.content;
  const nextStatus = payload.status ?? existing.status;
  const nextSlug = payload.slug ?? existing.slug ?? nextTitle;

  const finalSlug = await ensureUniqueSlug(nextSlug, id);
  const wordCount = countWords(nextContent);
  if (nextStatus === 'PUBLISHED' && wordCount < payload.minWordCount) {
    return NextResponse.json(
      { success: false, message: `Minimum ${payload.minWordCount} words required to publish.` },
      { status: 400 },
    );
  }

  const updated = await prisma.blog.update({
    where: { id },
    data: {
      title: nextTitle,
      content: nextContent,
      status: nextStatus,
      slug: finalSlug,
      canonical_url: payload.canonicalUrl === undefined ? existing.canonical_url : payload.canonicalUrl,
      meta_title: payload.metaTitle === undefined ? existing.meta_title : payload.metaTitle,
      meta_description: payload.metaDescription === undefined ? existing.meta_description : payload.metaDescription,
      primary_keyword: payload.primaryKeyword === undefined ? existing.primary_keyword : payload.primaryKeyword,
      secondary_keywords: payload.secondaryKeywords === undefined ? existing.secondary_keywords : payload.secondaryKeywords,
      published_at: nextStatus === 'PUBLISHED' ? existing.published_at ?? new Date() : null,
      word_count: wordCount,
      seo_title: payload.metaTitle === undefined ? existing.seo_title : payload.metaTitle,
      seo_desc: payload.metaDescription === undefined ? existing.seo_desc : payload.metaDescription,
    },
  });

  return NextResponse.json({ success: true, data: updated });
}
