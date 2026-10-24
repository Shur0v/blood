import { getPrisma } from "@/src/backend/config/db";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

import {blogPageLastModified,publicBlogUrl} from '@/src/lib/blogDiscovery';
import {BLOG_PAGE_SIZE} from '@/src/lib/blogArchive';

export const dynamic = 'force-dynamic';
export async function GET() {
  const baseUrl = getPublicBaseUrl();
  try {
    const prisma = getPrisma();
    const blogs = await prisma.blog.findMany({
      where: { status: "PUBLISHED", slug: { not: null } },
      select: { slug: true, canonical_url:true, updated_at: true },
      orderBy: { updated_at: "desc" },
    });
    return renderUrlSetXml([
      { url: `${baseUrl}/blog`, ...(blogs[0]?{lastModified:blogPageLastModified(blogs[0].updated_at)}:{}) },
      ...Array.from({length:Math.max(0,Math.ceil(blogs.length/BLOG_PAGE_SIZE)-1)},(_,index)=>({url:`${baseUrl}/blog?page=${index+2}`})),
      ...blogs
        .filter((blog) => publicBlogUrl(blog,baseUrl))
        .map((blog) => ({
          url: publicBlogUrl(blog,baseUrl)!,
          lastModified: blogPageLastModified(blog.updated_at),
        })),
    ], 'public, max-age=0, s-maxage=300, stale-while-revalidate=60');
  } catch {
    return new Response('Blog sitemap temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});
  }
}
