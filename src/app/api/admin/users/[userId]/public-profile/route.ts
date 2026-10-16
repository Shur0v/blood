import { NextResponse } from 'next/server';
import {z} from 'zod';
import {withActiveAdmin,requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {medicalAuditUser,privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {securityJson,securityRateLimit} from '@/src/backend/utils/security';
import {getPublicProfileSettings,savePublicProfileSettings} from '@/src/backend/services/publicDonorProfiles';
const Settings=z.object({isPublished:z.boolean(),showPhone:z.boolean(),bio:z.string().trim().max(1200),articleTemplate:z.number().int().min(0).max(9),authorizationConfirmed:z.boolean().optional()}).strict();
type Context={params:Promise<{userId:string}>};
export const GET=withActiveAdmin(async(req:Request,{params}:Context)=>{
 const userId=await medicalAuditUser(req,(await params).userId);
 return NextResponse.json({success:true,data:await getPublicProfileSettings(userId)},{headers:privateHeaders});
});
export const PATCH=withActiveAdmin(async(req:Request,{params}:Context)=>{
 const admin=await requireActiveAdmin(req),userId=await medicalAuditUser(req,(await params).userId);
 await securityRateLimit('admin-public-profile',admin.user_id,60,60*60*1000);
 const parsed=Settings.safeParse(await securityJson(req,8192));
 if(!parsed.success)return NextResponse.json({success:false,message:'Choose an article template and review the introduction (maximum 1,200 characters).'},{status:400,headers:privateHeaders});
 await savePublicProfileSettings(userId,parsed.data,admin.user_id);
 return NextResponse.json({success:true,data:await getPublicProfileSettings(userId)},{headers:privateHeaders});
});