import {NextResponse} from 'next/server';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {securityJson} from '@/src/backend/utils/security';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {getPrisma} from '@/src/backend/config/db';
import {saveHomepageContent} from '@/src/backend/services/homepageContent';
export const GET=withActiveAdmin(async()=>NextResponse.json({success:true,data:await getPrisma().homepageContent.findUnique({where:{key:'main'}})},{headers:privateHeaders}));
export const PUT=withActiveAdmin(async(req:Request)=>NextResponse.json({success:true,data:await saveHomepageContent(await securityJson(req,32*1024))},{headers:privateHeaders}));
