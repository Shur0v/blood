import {NextResponse} from 'next/server';
import {z} from 'zod';
import {withActiveAdmin,requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {securityJson,securityRateLimit} from '@/src/backend/utils/security';
import {changeLoginEmails,listLoginEmails} from '@/src/backend/services/loginEmails';
const Change=z.object({action:z.enum(['add','remove','primary']),email:z.string().trim().email().max(254)}).strict();
type Context={params:Promise<{userId:string}>};
export const GET=withActiveAdmin(async(_req:Request,{params}:Context)=>NextResponse.json({success:true,data:await listLoginEmails((await params).userId)},{headers:privateHeaders}));
export const PATCH=withActiveAdmin(async(req:Request,{params}:Context)=>{
  const admin=await requireActiveAdmin(req);await securityRateLimit('admin-login-email',admin.user_id,60,60*60*1000);
  const parsed=Change.safeParse(await securityJson(req,4096));
  if(!parsed.success)return NextResponse.json({success:false,message:'Choose an action and enter a valid email address.'},{status:400,headers:privateHeaders});
  return NextResponse.json({success:true,data:await changeLoginEmails((await params).userId,parsed.data,admin.user_id)},{headers:privateHeaders});
});
