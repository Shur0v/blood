import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {getPrisma} from '@/src/backend/config/db';
import {indiaEditorAreas} from '@/src/backend/services/indiaLocalContent';
import {indiaArea,IndiaConfigSchema} from '@/src/lib/indiaLocal';
import IndiaLocalExperience from '@/src/components/india/local/IndiaLocalExperience';
export const dynamic='force-dynamic';
export const metadata={title:'India local page preview',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{areaId:string}>}){try{await requireActiveAdmin(new Request('http://localhost/api/admin/india-content',{headers:new Headers(await headers())}));}catch{notFound();}const {areaId}=await params,area=areaId==='defaults'?indiaArea('chennai'):(await indiaEditorAreas()).find(a=>a.id===areaId);if(!area)notFound();const row=await getPrisma().indiaEditorialPage.findUnique({where:{area_id:areaId}});return <IndiaLocalExperience area={area} path={area.path||'/india/preview/'+area.id} city={area.kind==='state'?undefined:area.aliases[0]} legacy={area.kind==='legacy'} preview={IndiaConfigSchema.parse(row?.draft||{})}/>;}
