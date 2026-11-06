import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {getPrisma} from '@/src/backend/config/db';
import {pakistanEditorAreas} from '@/src/backend/services/pakistanLocalContent';
import {pakistanArea,PakistanConfigSchema} from '@/src/lib/pakistanLocal';
import PakistanLocalExperience from '@/src/components/pakistan/local/PakistanLocalExperience';
export const dynamic='force-dynamic';
export const metadata={title:'Pakistan local page preview',robots:{index:false,follow:false}};
export default async function Page({params}:{params:Promise<{areaId:string}>}){try{await requireActiveAdmin(new Request('http://localhost/api/admin/pakistan-content',{headers:new Headers(await headers())}));}catch{notFound();}const {areaId}=await params,area=areaId==='defaults'?pakistanArea('lahore'):(await pakistanEditorAreas()).find(a=>a.id===areaId);if(!area)notFound();const row=await getPrisma().pakistanEditorialPage.findUnique({where:{area_id:areaId}});return <PakistanLocalExperience area={area} path={area.path||'/pakistan/preview/'+area.id} city={area.kind==='region'?undefined:area.aliases[0]} legacy={area.kind==='legacy'} preview={PakistanConfigSchema.parse(row?.draft||{})}/>;}
