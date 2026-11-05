import {formatRegionalText} from '@/src/lib/regionalDesign';
import {notFound} from 'next/navigation';
import {INDIA_AREAS,indiaSearchCopy} from '@/src/lib/indiaLocal';
import {getIndiaPublication,indiaLocalContent} from '@/src/backend/services/indiaLocalContent';
import IndiaLocalExperience from '@/src/components/india/local/IndiaLocalExperience';
export const dynamic='force-dynamic';
type Params={kind:string;slug:string};
function resolve(p:Params){return INDIA_AREAS.find(a=>a.id===p.slug&&p.kind===(a.kind==='state'?'states':'cities'));}
export async function generateMetadata({params}:{params:Promise<Params>}){const area=resolve(await params);if(!area||!await getIndiaPublication(area.id))return {title:'India guide unavailable',robots:{index:false,follow:true}};const content=await indiaLocalContent(area,area.kind==='city'?area.aliases[0]:undefined),copy=indiaSearchCopy(area),title=formatRegionalText((content.config.sections?.introduction?.title||content.config.title||copy.title).replaceAll('{place}',area.name),{country:'India',city:area.name});return {title,description:copy.description,alternates:{canonical:area.path},robots:{index:true,follow:true},openGraph:{title,description:copy.description,url:area.path,type:'website',images:['/opengraph-image']},twitter:{card:'summary_large_image',title,description:copy.description,images:['/opengraph-image']}};}
export default async function Page({params}:{params:Promise<Params>}){const area=resolve(await params);if(!area)notFound();return <IndiaLocalExperience area={area} path={area.path!} city={area.kind==='city'?area.aliases[0]:undefined}/>;}
