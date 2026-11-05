import {NextResponse} from 'next/server';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {securityJson,securityRateLimit} from '@/src/backend/utils/security';
import {privateHeaders,MedicalError} from '@/src/backend/utils/medicalPrivacy';
import {getPublicBaseUrl} from '@/src/backend/config/env';
import {getPrisma} from '@/src/backend/config/db';
import {saveUsaContent} from '@/src/backend/services/usaContent';
import {USA_AREAS} from '@/src/lib/usaEdition';
export const GET=withActiveAdmin(async()=>NextResponse.json({success:true,data:{records:await getPrisma().usaEditorialPage.findMany(),areas:USA_AREAS}},{headers:privateHeaders}));
export const PUT=withActiveAdmin(async(req:Request)=>{
 const origin=req.headers.get('origin');if(origin&&!new Set([new URL(req.url).origin,new URL(getPublicBaseUrl()).origin]).has(origin))throw new MedicalError('Cross-origin request rejected.',403);
 if(req.headers.get('sec-fetch-site')==='cross-site')throw new MedicalError('Cross-site request rejected.',403);
 await securityRateLimit('usa-editorial',req.headers.get('cookie')||req.headers.get('authorization')||'admin',40,60_000);
 return NextResponse.json({success:true,data:await saveUsaContent(await securityJson(req,64*1024))},{headers:privateHeaders});
});
