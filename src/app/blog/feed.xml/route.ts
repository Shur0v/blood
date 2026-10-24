import { getPrisma } from '@/src/backend/config/db';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { renderBlogFeed } from '@/src/lib/blogDiscovery';

export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const posts = await getPrisma().blog.findMany({
      where: {status:'PUBLISHED', slug:{not:null}},
      select:{slug:true,canonical_url:true,title:true,content:true,meta_description:true,published_at:true,created_at:true,updated_at:true},
      orderBy:[{published_at:'desc'},{id:'desc'}],
    });
    return new Response(renderBlogFeed(posts,getPublicBaseUrl()),{headers:{'Content-Type':'application/atom+xml; charset=utf-8','Cache-Control':'public, max-age=0, s-maxage=300, stale-while-revalidate=60'}});
  } catch {
    return new Response('Article feed temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store','Retry-After':'60'}});
  }
}
