import {Prisma} from '@prisma/client';
import {getPrisma} from '../config/db';
import {MedicalError} from '../utils/medicalPrivacy';
export const normalizeLoginEmail=(value:string)=>value.trim().toLowerCase();
export type EmailDatabase=Pick<Prisma.TransactionClient,'user'|'userLoginEmail'>;
export async function findLoginUser(email:string,db:EmailDatabase=getPrisma()) {
  const normalized=normalizeLoginEmail(email);
  const primary=await db.user.findMany({where:{email:{equals:normalized,mode:'insensitive'}},take:2,orderBy:[{created_at:'asc'},{id:'asc'}]});
  const alias=await db.userLoginEmail.findUnique({where:{email:normalized},include:{User:true}});
  const owners=new Set([...primary.map(u=>u.id),...(alias?[alias.user_id]:[])]);
  if(owners.size>1)throw new MedicalError('This email is linked to conflicting accounts. Please contact support.',409);
  return primary[0]||alias?.User||null;
}
export async function listLoginEmails(userId:string,db:EmailDatabase=getPrisma()) {
  const user=await db.user.findUnique({where:{id:userId},select:{email:true}});
  if(!user)throw new MedicalError('User not found.',404);
  const aliases=await db.userLoginEmail.findMany({where:{user_id:userId},orderBy:{created_at:'asc'}});
  return {primaryEmail:user.email,emails:[{email:user.email,primary:true},...aliases.map(row=>({email:row.email,primary:false}))]};
}
export type EmailChange={action:'add'|'remove'|'primary'|'replacePrimary';email:string};
export async function changeLoginEmailsInTransaction(tx:Prisma.TransactionClient,userId:string,change:EmailChange,adminId:string){
  const email=normalizeLoginEmail(change.email);
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`login-emails-user:${userId}`},0))`;
  const before=await listLoginEmails(userId,tx);
  for(const key of [...new Set([...before.emails.map(row=>normalizeLoginEmail(row.email)),email])].sort())await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${`registration-email:${key}`},0))`;
  const owner=await findLoginUser(email,tx);
  if(owner&&owner.id!==userId)throw new MedicalError('This email address already belongs to another account.',409);
  const primary=normalizeLoginEmail(before.primaryEmail);
  const current=before.emails.find(row=>normalizeLoginEmail(row.email)===email);
  if(change.action==='add'){
    if(current)throw new MedicalError('This user already has this email address.',409);
    if(before.emails.length>=10)throw new MedicalError('A user can have up to 10 login email addresses.');
    await tx.userLoginEmail.create({data:{user_id:userId,email}});
  }else if(change.action==='remove'){
    if(!current)throw new MedicalError('This email is not linked to this user.',404);
    if(before.emails.length===1)throw new MedicalError('Keep at least one login email. Add a replacement before removing the last email.');
    if(current.primary){const replacement=before.emails.find(row=>!row.primary)!;await tx.userLoginEmail.delete({where:{email:replacement.email}});await tx.user.update({where:{id:userId},data:{email:replacement.email}});}
    else await tx.userLoginEmail.delete({where:{email}});
  }else if(email!==primary){
    if(change.action==='primary'&&!current)throw new MedicalError('Add this email before making it primary.');
    if(current)await tx.userLoginEmail.delete({where:{email}});
    await tx.user.update({where:{id:userId},data:{email}});
    if(change.action==='primary')await tx.userLoginEmail.create({data:{user_id:userId,email:primary}});
  }
  // Codes issued before a support change must not authenticate a reassigned address.
  await tx.otpVerification.deleteMany({where:{OR:before.emails.concat({email,primary:false}).map(row=>({email:{equals:row.email,mode:'insensitive'}}))}});
  await tx.authRiskEvent.create({data:{user_id:userId,event_type:'ADMIN_LOGIN_EMAIL_CHANGED',reason:JSON.stringify({adminId,action:change.action,email,previousPrimary:before.primaryEmail}),score_delta:0}});
  return listLoginEmails(userId,tx);
}
export const changeLoginEmails=(userId:string,change:EmailChange,adminId:string)=>getPrisma().$transaction(tx=>changeLoginEmailsInTransaction(tx,userId,change,adminId));
