import {getPublicBaseUrl} from '@/src/backend/config/env';
import {REGION_SLUGS} from '@/src/lib/sitemapChunks';
import {REGIONS} from '@/src/lib/regions';
import {renderUrlSetXml} from '@/src/lib/sitemapXml';
import {getRegionalPublicationDates,regionalLastModified} from '@/src/backend/services/regionalContent';
export const dynamic='force-dynamic';
export async function GET(){const base=getPublicBaseUrl(),dates=await getRegionalPublicationDates();return renderUrlSetXml(REGION_SLUGS.map(slug=>{const region=REGIONS.find(row=>row.slug===slug);return {url:base+'/'+slug,...(region?{lastModified:regionalLastModified(region.country,undefined,new Date(0),dates)}:{})};}));}
