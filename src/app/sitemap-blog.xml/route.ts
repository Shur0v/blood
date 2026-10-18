import { getPrisma } from "@/src/backend/config/db";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  try {
    const prisma = getPrisma();
    const blogs = await prisma.blog.findMany({
      where: { status: "PUBLISHED", slug: { not: null } },
      select: { slug: true, updated_at: true },
      orderBy: { updated_at: "desc" },
      take: 5000,
    });
    return renderUrlSetXml([
      { url: `${baseUrl}/blog`, ...(blogs[0]?{lastModified:blogs[0].updated_at}:{}) },
      ...Array.from({length:Math.max(0,Math.ceil(blogs.length/20)-1)},(_,index)=>({url:`${baseUrl}/blog?page=${index+2}`})),
      ...blogs
        .filter((blog) => blog.slug)
        .map((blog) => ({
          url: `${baseUrl}/blog/${blog.slug}`,
          lastModified: blog.updated_at,
        })),
    ]);
  } catch {
    return new Response('Blog sitemap temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});
  }
}
