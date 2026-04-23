import { NextResponse } from 'next/server';
import { getPrisma } from '@/src/backend/config/db';
import { DEFAULT_LOCALE, resolveLocaleFromRequest } from '@/src/lib/locale';
import { translateObjectFields } from '@/src/backend/services/translationService';

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const resolved = await params;
  if (!resolved.slug) {
    return NextResponse.json({ success: false, message: 'Slug is required.' }, { status: 400 });
  }

  const prisma = getPrisma();
  const row = await prisma.blog.findFirst({
    where: {
      slug: resolved.slug,
      status: 'PUBLISHED',
    },
  });

  if (!row) {
    return NextResponse.json({ success: false, message: 'Blog not found.' }, { status: 404 });
  }

  const locale = resolveLocaleFromRequest(req);

  const translated = locale !== DEFAULT_LOCALE
    ? await translateObjectFields({
        prisma,
        locale,
        contentTypePrefix: `blog:${row.id}`,
        contentVersion: row.updated_at.toISOString(),
        obj: row as unknown as Record<string, unknown>,
        fields: ['title', 'content', 'meta_description', 'meta_title', 'seo_title', 'seo_desc'],
      })
    : row;

  return NextResponse.json({ success: true, data: translated, meta: { locale } });
}
