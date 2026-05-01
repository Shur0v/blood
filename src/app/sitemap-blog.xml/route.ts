import { getPrisma } from "@/src/backend/config/db";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const now = new Date();
  try {
    const prisma = getPrisma();
    const blogs = await prisma.blog.findMany({
      where: { status: "PUBLISHED", slug: { not: null } },
      select: { slug: true, updated_at: true },
      orderBy: { updated_at: "desc" },
      take: 5000,
    });
    return renderUrlSetXml([
      { url: `${baseUrl}/blog`, lastModified: now },
      ...blogs
        .filter((blog) => blog.slug)
        .map((blog) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: blog.updated_at || now,
        })),
    ]);
  } catch {
    return renderUrlSetXml([{ url: `${baseUrl}/blog`, lastModified: now }]);
  }
}
