import {NextResponse} from 'next/server';
import {z} from 'zod';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {securityJson} from '@/src/backend/utils/security';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {getPrisma} from '@/src/backend/config/db';
import {getUiControls} from '@/src/backend/services/uiControls';
export const GET=withActiveAdmin(async()=>NextResponse.json({success:true,data:await getUiControls()},{headers:privateHeaders}));
export const PATCH=withActiveAdmin(async(req:Request)=>{
  const parsed=z.object({discoveryVisible:z.boolean()}).strict().safeParse(await securityJson(req,1024));
  if(!parsed.success)return NextResponse.json({success:false,message:'Choose whether to show the discovery button.'},{status:400,headers:privateHeaders});
  await getPrisma().$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended('bloodnet-site-controls',0))`;
    const current=await tx.platformSettings.findFirst({orderBy:[{updated_at:'desc'},{id:'desc'}],select:{id:true}});
    if(current)await tx.platformSettings.update({where:{id:current.id},data:{discovery_visible:parsed.data.discoveryVisible}});
    else await tx.platformSettings.create({data:{discovery_visible:parsed.data.discoveryVisible}});
    await tx.$queryRaw`SELECT 1 FROM pg_notify('bloodnet_ui_controls',${JSON.stringify(parsed.data)})`;
  });
  return NextResponse.json({success:true,data:parsed.data},{headers:privateHeaders});
});
