import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { ADMIN_ROLES, getSessionFromRequest, hasRequiredRole } from '@/src/backend/utils/session';
import { countWords, slugify } from '@/src/backend/utils/slug';

const optionalTrimmedString = (max: number) =>
  z.preprocess(
    (val) => {
      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().max(max).optional(),
  );

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(20),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

const CreateBlogSchema = z.object({
  title: z.string().trim().min(5).max(180),
  content: z.string().trim().min(100),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
  slug: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().min(3).max(180).optional(),
  ),
  canonicalUrl: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    },
    z.string().url().optional(),
  ),
  metaTitle: optionalTrimmedString(180),
  metaDescription: optionalTrimmedString(320),
  primaryKeyword: optionalTrimmedString(120),
  secondaryKeywords: z
    .array(z.string().trim().max(120))
    .optional()
    .transform((items) => (items ?? []).map((item) => item.trim()).filter(Boolean)),
  minWordCount: z.coerce.number().int().min(300).max(3000).default(1200),
});

const ensureAdminSession = (req: Request): NextResponse | null => {
  const session = getSessionFromRequest(req);
  if (!session) return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  if (!hasRequiredRole(session, ADMIN_ROLES)) return NextResponse.json({ success: false, message: 'Forbidden' }, { status: 403 });
  return null;
};

const ensureUniqueSlug = async (requested: string, excludeId?: string) => {
  const prisma = getPrisma();
  const base = slugify(requested) || `post-${Date.now()}`;
  let attempt = base;
  let i = 1;
  while (true) {
    const existing = await prisma.blog.findFirst({
      where: {
        slug: attempt,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    });
    if (!existing) return attempt;
    i += 1;
    attempt = `${base}-${i}`;
  }
};

export async function GET(req: Request) {
  const authError = ensureAdminSession(req);
  if (authError) return authError;

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '20',
    status: url.searchParams.get('status') || undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
  }

  const { page, limit, status } = parsed.data;
  const prisma = getPrisma();

  const where = {
    ...(status ? { status } : {}),
  };

  const [rows, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { updated_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.blog.count({ where }),
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
  });
}

export async function POST(req: Request) {
  const authError = ensureAdminSession(req);
  if (authError) return authError;

  const parsed = CreateBlogSchema.safeParse(await req.json());
  if (!parsed.success) {
    const reason = parsed.error.issues[0]?.message || 'Invalid blog payload.';
    return NextResponse.json({ success: false, message: reason }, { status: 400 });
  }

  const payload = parsed.data;
  const wordCount = countWords(payload.content);
  if (payload.status === 'PUBLISHED' && wordCount < payload.minWordCount) {
    return NextResponse.json(
      { success: false, message: `Minimum ${payload.minWordCount} words required to publish.` },
      { status: 400 },
    );
  }

  const finalSlug = await ensureUniqueSlug(payload.slug || payload.title);
  const now = new Date();
  const row = await getPrisma().blog.create({
    data: {
      title: payload.title,
      content: payload.content,
      author_id: 'admin',
      author_type: 'ADMIN',
      is_anonymous: false,
      status: payload.status,
      slug: finalSlug,
      canonical_url: payload.canonicalUrl || null,
      meta_title: payload.metaTitle || null,
      meta_description: payload.metaDescription || null,
      primary_keyword: payload.primaryKeyword || null,
      secondary_keywords: payload.secondaryKeywords ?? [],
      published_at: payload.status === 'PUBLISHED' ? now : null,
      word_count: wordCount,
      seo_title: payload.metaTitle || null,
      seo_desc: payload.metaDescription || null,
    },
  });

  return NextResponse.json({ success: true, data: row }, { status: 201 });
}
