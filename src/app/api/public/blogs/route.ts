import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getPrisma } from '@/src/backend/config/db';
import { DEFAULT_LOCALE, resolveLocaleFromRequest } from '@/src/lib/locale';
import { translateTextCached } from '@/src/backend/services/translationService';

const QuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(20).default(10),
  authorType: z.enum(['ALL', 'USER', 'ADMIN']).default('ALL'),
});

export async function GET(req: Request) {
  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    page: url.searchParams.get('page') || '1',
    limit: url.searchParams.get('limit') || '10',
    authorType: (url.searchParams.get('authorType') || 'ALL').toUpperCase(),
  });
  if (!parsed.success) {
    return NextResponse.json({ success: false, message: 'Invalid query params.' }, { status: 400 });
  }

  const { page, limit, authorType } = parsed.data;
  const prisma = getPrisma();
  const resolvedLocale = resolveLocaleFromRequest(req);

  const where = {
    status: 'PUBLISHED',
    ...(authorType !== 'ALL' ? { author_type: authorType } : {}),
  };
  const [rows, total] = await Promise.all([
    prisma.blog.findMany({
      where,
      orderBy: { published_at: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        title: true,
        slug: true,
        content: true,
        published_at: true,
        created_at: true,
        author_id: true,
        author_type: true,
        is_anonymous: true,
        meta_description: true,
        primary_keyword: true,
        word_count: true,
      },
    }),
    prisma.blog.count({ where }),
  ]);
  const authorIds = [...new Set(rows.map((row) => row.author_id).filter(Boolean))];
  const userRows = authorIds.length
    ? await prisma.user.findMany({
        where: { id: { in: authorIds } },
        select: { id: true, name: true, location_city: true, profile_image_url: true },
      })
    : [];
  const userMap = new Map(userRows.map((row) => [row.id, row]));

  const data = await Promise.all(rows.map(async (row) => {
    const translatedTitle =
      resolvedLocale !== DEFAULT_LOCALE
        ? await translateTextCached({
            prisma,
            sourceText: row.title,
            locale: resolvedLocale,
            contentType: 'blog:title',
            contentVersion: row.id,
          })
        : row.title;
    const baseExcerpt = row.meta_description || row.content.slice(0, 180);
    const translatedExcerpt =
      resolvedLocale !== DEFAULT_LOCALE
        ? await translateTextCached({
            prisma,
            sourceText: baseExcerpt,
            locale: resolvedLocale,
            contentType: 'blog:excerpt',
            contentVersion: row.id,
          })
        : baseExcerpt;

    return ({
    ...row,
    title: translatedTitle,
    excerpt: translatedExcerpt,
    is_user_story: row.author_type === 'USER' || userMap.has(row.author_id),
    is_anonymous: row.is_anonymous,
    author_name:
      row.author_type === 'USER' || userMap.has(row.author_id)
        ? row.is_anonymous
          ? 'Anonymous'
          : userMap.get(row.author_id)?.name || 'BloodNet User'
        : 'BloodNet Editorial',
    author_city: row.author_type === 'USER' || userMap.has(row.author_id) ? userMap.get(row.author_id)?.location_city || null : null,
    author_profile_image:
      row.author_type === 'USER' || userMap.has(row.author_id)
        ? row.is_anonymous
          ? null
          : userMap.get(row.author_id)?.profile_image_url || null
        : null,
    });
  }));

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
      locale: resolvedLocale,
    },
  });
}
