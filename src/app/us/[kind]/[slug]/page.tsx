import type {Metadata} from 'next';
import {notFound} from 'next/navigation';
import {USA_AREAS} from '@/src/lib/usaEdition';
import {getUsaPublication,usaContent} from '@/src/backend/services/usaContent';
import {usaAreaMetadata} from '@/src/lib/usaSeo';
import UsaExperience from '@/src/components/usa/UsaExperience';
export const dynamic='force-dynamic';
type Params={kind:string;slug:string};
function resolve(p:Params){return USA_AREAS.find(area=>area.slug===p.slug&&p.kind===(area.kind==='state'?'states':'cities'));}
export async function generateMetadata({params}:{params:Promise<Params>}):Promise<Metadata>{const area=resolve(await params);if(!area||!await getUsaPublication(area.id))return {title:'Area guide unavailable',robots:{index:false,follow:true}};return usaAreaMetadata(area,(await usaContent(area)).config);}
export default async function Page({params}:{params:Promise<Params>}){const area=resolve(await params);if(!area)notFound();return <UsaExperience area={area}/>;}
