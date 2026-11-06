import {pakistanEditorialDates,pakistanEditorialModified} from '@/src/backend/services/pakistanLocalContent';
import {indiaEditorialDates,indiaEditorialModified} from '@/src/backend/services/indiaLocalContent';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { getDonorLocations, donorLocationPath } from '@/src/backend/services/donorLocations';
import { renderUrlSetXml } from '@/src/lib/sitemapXml';
import { bloodGroupToSlug } from '@/src/lib/seoRouting';
import {getRegionalPublicationDates,regionalLastModified} from '@/src/backend/services/regionalContent';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const base = getPublicBaseUrl(), [rawRows,dates,indiaDates,pakistanDates] = await Promise.all([getDonorLocations(),getRegionalPublicationDates(),indiaEditorialDates(),pakistanEditorialDates()]);
    const rows=rawRows;
    const urls = rows.flatMap(row => [
      ...(row.bloodCount > 0 ? [{ url: base + donorLocationPath(row,'blood'), lastModified: row.country.toLowerCase()==='pakistan'?pakistanEditorialModified(row.city,regionalLastModified(row.country,row.city,row.updatedAt,dates),pakistanDates):row.country.toLowerCase()==='india'?indiaEditorialModified(row.city,regionalLastModified(row.country,row.city,row.updatedAt,dates),indiaDates):regionalLastModified(row.country,row.city,row.updatedAt,dates) }] : []),
      ...(row.organCount > 0 ? [{ url: base + donorLocationPath(row,'organ'), lastModified: row.country.toLowerCase()==='pakistan'?pakistanEditorialModified(row.city,regionalLastModified(row.country,row.city,row.updatedAt,dates),pakistanDates):row.country.toLowerCase()==='india'?indiaEditorialModified(row.city,row.updatedAt,indiaDates):row.updatedAt }] : []),
      ...row.bloodGroups.filter(group=>bloodGroupToSlug(group)).map(group=>({url:base+donorLocationPath(row,'blood')+'/'+bloodGroupToSlug(group),lastModified:row.country.toLowerCase()==='pakistan'?pakistanEditorialModified(row.city,regionalLastModified(row.country,row.city,row.updatedAt,dates),pakistanDates):row.country.toLowerCase()==='india'?indiaEditorialModified(row.city,regionalLastModified(row.country,row.city,row.updatedAt,dates),indiaDates):regionalLastModified(row.country,row.city,row.updatedAt,dates)})),
    ]);
    return renderUrlSetXml(urls, 'public, max-age=0, s-maxage=300, stale-while-revalidate=300');
  } catch {
    return new Response('Location sitemap temporarily unavailable.', { status:503, headers:{'Cache-Control':'no-store','Retry-After':'60'} });
  }
}
