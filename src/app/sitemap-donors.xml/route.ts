import { listPublicDonorProfiles } from '@/src/backend/services/publicDonorProfiles';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { renderUrlSetXml } from '@/src/lib/sitemapXml';
export const dynamic='force-dynamic';
export async function GET(){try{const rows=await listPublicDonorProfiles(50000);const response=renderUrlSetXml(rows.map(row=>({url:`${getPublicBaseUrl()}/donors/${row.slug}`,lastModified:row.updated_at})));response.headers.set('Cache-Control','no-store');return response;}catch{return new Response('Sitemap temporarily unavailable',{status:503,headers:{'Retry-After':'300','Cache-Control':'no-store'}});}}
