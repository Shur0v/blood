import {formatRegionalText} from '@/src/lib/regionalDesign';
import {notFound} from 'next/navigation';
import {PAKISTAN_AREAS,pakistanSearchCopy} from '@/src/lib/pakistanLocal';
import {getPakistanPublication,pakistanLocalContent} from '@/src/backend/services/pakistanLocalContent';
import PakistanLocalExperience from '@/src/components/pakistan/local/PakistanLocalExperience';
export const dynamic='force-dynamic';
type Params={kind:string;slug:string};
function resolve(p:Params){return PAKISTAN_AREAS.find(a=>a.id===p.slug&&p.kind===(a.kind==='region'?'regions':'cities'));}
export async function generateMetadata({params}:{params:Promise<Params>}){const area=resolve(await params);if(!area||!await getPakistanPublication(area.id))return {title:'Pakistan guide unavailable',robots:{index:false,follow:true}};const content=await pakistanLocalContent(area,area.kind==='city'?area.aliases[0]:undefined),copy=pakistanSearchCopy(area),title=formatRegionalText((content.config.sections?.introduction?.title||content.config.title||copy.title).replaceAll('{place}',area.name),{country:'Pakistan',city:area.name});return {title,description:copy.description,alternates:{canonical:area.path},robots:{index:true,follow:true},openGraph:{title,description:copy.description,url:area.path,type:'website',images:['/opengraph-image']},twitter:{card:'summary_large_image',title,description:copy.description,images:['/opengraph-image']}};}
export default async function Page({params}:{params:Promise<Params>}){const area=resolve(await params);if(!area)notFound();return <PakistanLocalExperience area={area} path={area.path!} city={area.kind==='city'?area.aliases[0]:undefined}/>;}
