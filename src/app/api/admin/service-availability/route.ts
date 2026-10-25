import {NextResponse} from 'next/server';
import {withActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {securityJson} from '@/src/backend/utils/security';
import {getPrisma} from '@/src/backend/config/db';
import {getDonorLocations} from '@/src/backend/services/donorLocations';
import {saveAvailability} from '@/src/backend/services/publicContent';
export const GET=withActiveAdmin(async()=>NextResponse.json({success:true,data:{records:await getPrisma().serviceAvailability.findMany(),locations:(await getDonorLocations()).map(({country,city})=>({country,city}))}},{headers:privateHeaders}));
export const PUT=withActiveAdmin(async(req:Request)=>NextResponse.json({success:true,data:await saveAvailability(await securityJson(req,32*1024))},{headers:privateHeaders}));
