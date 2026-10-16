import { getDonorLocations } from '@/src/backend/services/donorLocations';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { renderUrlSetXml } from '@/src/lib/sitemapXml';
export const dynamic='force-dynamic';
export async function GET(){try{const rows=await getDonorLocations(),base=getPublicBaseUrl(),countries=[...new Set(rows.map(row=>row.country))];return renderUrlSetXml([{url:base+'/network'},...countries.map(country=>({url:`${base}/network/${toLocationSlug(country)}`,lastModified:new Date(Math.max(...rows.filter(row=>row.country===country).map(row=>row.updatedAt.getTime())))}))]);}catch{return new Response('Network sitemap temporarily unavailable.',{status:503,headers:{'Cache-Control':'no-store'}});}}
