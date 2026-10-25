import {NextResponse} from 'next/server';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {securityJson} from '@/src/backend/utils/security';
import {getPrisma} from '@/src/backend/config/db';
import {savePublicContent} from '@/src/backend/services/publicContent';
export const GET=withActiveAdmin(async()=>NextResponse.json({success:true,data:await getPrisma().publicPageContent.findMany()},{headers:privateHeaders}));
export const PUT=withActiveAdmin(async(req:Request)=>NextResponse.json({success:true,data:await savePublicContent(await securityJson(req,32*1024))},{headers:privateHeaders}));
