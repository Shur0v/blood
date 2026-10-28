import {NextResponse} from 'next/server';
import {z} from 'zod';
import {withActiveAdmin,requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {MedicalError,privateHeaders} from '@/src/backend/utils/medicalPrivacy';
import {resolveNotificationDestination} from '@/src/backend/services/notificationDestinations';
export const dynamic='force-dynamic';
export const GET=withActiveAdmin(async(req:Request,context:{params:Promise<{id:string}>})=>{
 const admin=await requireActiveAdmin(req);if(admin.role!=='ADMIN')throw new MedicalError('Administrator access required.',403);
 const {id}=await context.params;if(!z.string().uuid().safeParse(id).success)throw new MedicalError('Invalid notification.',400);
 return NextResponse.json({success:true,data:await resolveNotificationDestination(id)},{headers:privateHeaders});
});
