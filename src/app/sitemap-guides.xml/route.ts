import { DONATION_GUIDES, EDITORIAL_REVIEW_DATE } from '@/src/lib/donationGuides';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { renderUrlSetXml } from '@/src/lib/sitemapXml';
export async function GET(){const base=getPublicBaseUrl();return renderUrlSetXml([{url:base+'/guides',lastModified:new Date(EDITORIAL_REVIEW_DATE)},...DONATION_GUIDES.map(guide=>({url:`${base}/guides/${guide.slug}`,lastModified:new Date(EDITORIAL_REVIEW_DATE)}))]);}
