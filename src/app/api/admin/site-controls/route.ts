import {NextResponse} from 'next/server';
import {z} from 'zod';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {securityJson} from '@/src/backend/utils/security';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {getPrisma} from '@/src/backend/config/db';
import {getUiControls} from '@/src/backend/services/uiControls';
export const GET=withActiveAdmin(async()=>NextResponse.json({success:true,data:await getUiControls()},{headers:privateHeaders}));
export const PATCH=withActiveAdmin(async(req:Request)=>{
  const parsed=z.object({discoveryVisible:z.boolean().optional(),patientIdVisible:z.boolean().optional(),cityDonationRequestVisible:z.boolean().optional()}).strict().refine(value=>Object.keys(value).length>0).safeParse(await securityJson(req,1024));
  if(!parsed.success)return NextResponse.json({success:false,message:'Choose a valid visibility setting.'},{status:400,headers:privateHeaders});
  const controls=await getPrisma().$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended('bloodnet-site-controls',0))`;
    const current=await tx.platformSettings.findFirst({orderBy:[{updated_at:'desc'},{id:'desc'}],select:{id:true}});
    const data={...(parsed.data.cityDonationRequestVisible!==undefined?{city_donation_request_visible:parsed.data.cityDonationRequestVisible}:{}),...(parsed.data.discoveryVisible!==undefined?{discovery_visible:parsed.data.discoveryVisible}:{}),...(parsed.data.patientIdVisible!==undefined?{patient_id_visible:parsed.data.patientIdVisible}:{})};
    const row=current?await tx.platformSettings.update({where:{id:current.id},data}):await tx.platformSettings.create({data});
    const value={discoveryVisible:row.discovery_visible,patientIdVisible:row.patient_id_visible,cityDonationRequestVisible:row.city_donation_request_visible};
    await tx.$queryRaw`SELECT 1 FROM pg_notify('bloodnet_ui_controls',${JSON.stringify(value)})`;
    return value;
  });
  return NextResponse.json({success:true,data:controls},{headers:privateHeaders});
});
