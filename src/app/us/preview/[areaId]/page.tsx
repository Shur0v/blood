import {headers} from 'next/headers';
import {notFound} from 'next/navigation';
import {requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {getPrisma} from '@/src/backend/config/db';
import {UsaConfigSchema,usaArea} from '@/src/lib/usaEdition';
import UsaExperience from '@/src/components/usa/UsaExperience';
export const dynamic='force-dynamic';
export const metadata={title:'USA editorial preview',robots:{index:false,follow:false}};
export default async function Preview({params}:{params:Promise<{areaId:string}>}){
 const h=await headers();try{await requireActiveAdmin(new Request('http://localhost/api/admin/us-content',{headers:new Headers(h)}));}catch{notFound();}
 const {areaId}=await params,area=usaArea(areaId);if(!area&&areaId!=='country')notFound();
 const record=await getPrisma().usaEditorialPage.findUnique({where:{area_id:areaId}});return <UsaExperience area={area} preview={UsaConfigSchema.parse(record?.draft||{})}/>;
}
