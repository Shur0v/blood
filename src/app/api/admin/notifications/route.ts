import {NextResponse} from 'next/server';
import {withActiveAdmin,requireActiveAdmin} from '@/src/backend/utils/activeAdmin';
import {privateHeaders,MedicalError} from '@/src/backend/utils/medicalPrivacy';
import {securityJson} from '@/src/backend/utils/security';
import {getPrisma} from '@/src/backend/config/db';
import {listAdminNotifications} from '@/src/backend/services/adminNotifications';
import {z} from 'zod';
export const GET=withActiveAdmin(async(req:Request)=>{const admin=await requireActiveAdmin(req);if(admin.role!=='ADMIN')throw new MedicalError('Administrator access required.',403);return NextResponse.json({success:true,data:await listAdminNotifications(req,admin.user_id)},{headers:privateHeaders});});
export const PATCH=withActiveAdmin(async(req:Request)=>{const admin=await requireActiveAdmin(req);if(admin.role!=='ADMIN')throw new MedicalError('Administrator access required.',403);const input=z.object({ids:z.array(z.string().uuid()).min(1).max(50),read:z.boolean()}).strict().safeParse(await securityJson(req));if(!input.success)throw new MedicalError('Choose up to 50 notifications.',400);const db=getPrisma(),ids=(await db.adminNotification.findMany({where:{id:{in:input.data.ids}},select:{id:true}})).map(row=>row.id);if(input.data.read)await db.adminNotificationRead.createMany({data:ids.map(id=>({notification_id:id,admin_id:admin.user_id})),skipDuplicates:true});else await db.adminNotificationRead.deleteMany({where:{notification_id:{in:ids},admin_id:admin.user_id}});return NextResponse.json({success:true},{headers:privateHeaders});});
