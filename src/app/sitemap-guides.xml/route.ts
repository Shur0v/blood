import { DONATION_GUIDES, EDITORIAL_REVIEW_DATE } from '@/src/lib/donationGuides';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { renderUrlSetXml } from '@/src/lib/sitemapXml';
export async function GET(){const base=getPublicBaseUrl(),latest=DONATION_GUIDES.reduce((date,guide)=>guide.updatedAt&&guide.updatedAt>date?guide.updatedAt:date,EDITORIAL_REVIEW_DATE);return renderUrlSetXml([{url:base+'/guides',lastModified:new Date(latest)},...DONATION_GUIDES.map(guide=>({url:`${base}/guides/${guide.slug}`,lastModified:new Date(guide.updatedAt||EDITORIAL_REVIEW_DATE)}))]);}
