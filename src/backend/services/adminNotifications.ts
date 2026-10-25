import {getPrisma} from '../config/db';
import {ADMIN_WORKSPACE,NOTIFICATION_FAMILIES,type NotificationFamily} from '@/src/lib/adminNotifications';
import {MedicalError} from '../utils/medicalPrivacy';
import {z} from 'zod';
export async function recordAdminEvent(input:{type:string;family:NotificationFamily;title:string;detail:string;dedupeKey:string;href?:string;country?:string;city?:string;occurredAt?:Date}){return getPrisma().adminNotification.upsert({where:{dedupe_key:input.dedupeKey},update:{},create:{type:input.type,family:input.family,title:input.title,detail:input.detail,dedupe_key:input.dedupeKey,href:input.href||ADMIN_WORKSPACE,country:input.country,city:input.city,occurred_at:input.occurredAt}});}
export async function listAdminNotifications(req:Request,adminId:string){
 const q=new URL(req.url).searchParams,limit=Math.min(50,Math.max(1,Math.trunc(Number(q.get('limit')))||30)),family=q.get('family'),country=q.get('country'),cursor=q.get('cursor');
 if(family&&!Object.hasOwn(NOTIFICATION_FAMILIES,family))throw new MedicalError('Choose a notification family.',400);
 if(country&&country.length>100)throw new MedicalError('Invalid country filter.',400);
 if(cursor&&!z.string().uuid().safeParse(cursor).success)throw new MedicalError('Invalid notification cursor.',400);
 const db=getPrisma(),where={...(family?{family}:{}),...(country?{country}:{}),...(q.get('unread')==='true'?{Reads:{none:{admin_id:adminId}}}:{})};
 const [rows,unreadCount,countries]=await Promise.all([db.adminNotification.findMany({where,orderBy:[{occurred_at:'desc'},{id:'desc'}],take:limit+1,...(cursor?{cursor:{id:cursor},skip:1}:{}),include:{Reads:{where:{admin_id:adminId},select:{read_at:true}}}}),db.adminNotification.count({where:{Reads:{none:{admin_id:adminId}}}}),db.adminNotification.findMany({where:{country:{not:null}},distinct:['country'],select:{country:true},orderBy:{country:'asc'}})]);
 return {items:rows.slice(0,limit).map(row=>({id:row.id,type:row.type,family:row.family,title:row.title,detail:row.detail,country:row.country,city:row.city,href:row.href,reminder:row.reminder,occurredAt:row.occurred_at.toISOString(),read:row.Reads.length>0})),unreadCount,countries:countries.map(row=>row.country),nextCursor:rows.length>limit?rows[limit-1].id:null};
}

export async function withNotificationBatch<T>(id:string,work:(tx:import('@prisma/client').Prisma.TransactionClient)=>Promise<T>){return getPrisma().$transaction(async tx=>{await tx.$queryRaw`SELECT set_config('bloodnet.notification_batch',${id},true)`;return work(tx);});}
