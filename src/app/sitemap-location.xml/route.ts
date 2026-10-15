import { getPublicBaseUrl } from '@/src/backend/config/env';
import { getDonorLocations, donorLocationPath } from '@/src/backend/services/donorLocations';
import { renderUrlSetXml } from '@/src/lib/sitemapXml';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const base = getPublicBaseUrl(), rows = await getDonorLocations();
    const urls = rows.flatMap(row => [
      ...(row.bloodCount > 0 ? [{ url: base + donorLocationPath(row,'blood'), lastModified: row.updatedAt }] : []),
      ...(row.organCount > 0 ? [{ url: base + donorLocationPath(row,'organ'), lastModified: row.updatedAt }] : []),
    ]);
    return renderUrlSetXml(urls, 'public, max-age=0, s-maxage=300, stale-while-revalidate=300');
  } catch {
    return new Response('Location sitemap temporarily unavailable.', { status:503, headers:{'Cache-Control':'no-store','Retry-After':'60'} });
  }
}
