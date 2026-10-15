import { createHmac } from 'node:crypto';
import { getPrisma } from '../config/db';
import { MedicalError, medicalFailure } from './medicalPrivacy';
import { boundedBody } from './boundedBody';

export const securityFailure = medicalFailure;
export async function securityJson(req:Request,limit=32*1024) {
  try {return JSON.parse(new TextDecoder().decode(await boundedBody(req,limit)));}
  catch(error){if(error instanceof MedicalError)throw error;throw new MedicalError('Invalid JSON.',400);}
}
export function securityDigest(value:string) {
  const key=process.env.JWT_SECRET;
  if(!key||key.length<32)throw new MedicalError('Authentication is not configured.',503);
  return createHmac('sha256',key).update(value).digest('hex');
}

// Durable across Node workers and restarts, using the existing indexed risk table.
// The transaction lock serializes a bucket before counting/admitting attempts.
export async function securityRateLimit(scope:string,key:string,limit:number,windowMs:number) {
  const digest=securityDigest(`${scope}:${key}`),since=new Date(Date.now()-windowMs);
  const admitted=await getPrisma().$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${digest},0))`;
    const count=await tx.authRiskEvent.count({where:{event_type:'SECURITY_RATE_LIMIT',fingerprint_hash:digest,created_at:{gte:since}}});
    if(count>=limit)return false;
    await tx.authRiskEvent.create({data:{event_type:'SECURITY_RATE_LIMIT',fingerprint_hash:digest,reason:'Security rate limit accounting.',score_delta:0}});
    return true;
  });
  if(!admitted)throw new MedicalError('Too many attempts. Please try again later.',429);
}
