import {getPublicBaseUrl} from '@/src/backend/config/env';
import {REGION_SLUGS} from '@/src/lib/sitemapChunks';
import {REGIONS} from '@/src/lib/regions';
import {renderUrlSetXml} from '@/src/lib/sitemapXml';
import {getRegionalPublicationDates,regionalLastModified} from '@/src/backend/services/regionalContent';
import {getUsaPublication,listPublishedUsaAreas} from '@/src/backend/services/usaContent';
export const dynamic='force-dynamic';
export async function GET(){const base=getPublicBaseUrl(),dates=await getRegionalPublicationDates(),usa=await getUsaPublication('country');return renderUrlSetXml([...(await listPublishedUsaAreas()).map(area=>({url:base+area.path,...(area.modified?{lastModified:area.modified}:{})})),...REGION_SLUGS.map(slug=>{const region=REGIONS.find(row=>row.slug===slug);const regional=region?regionalLastModified(region.country,undefined,new Date(0),dates):undefined;const modified=slug==='us'&&usa?.modified&&(!regional||usa.modified>regional)?usa.modified:regional;return {url:base+'/'+slug,...(modified?{lastModified:modified}:{})};})]);}
