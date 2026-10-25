import {cache} from 'react';
import {getPrisma} from '../config/db';
import {MedicalError} from '../utils/medicalPrivacy';
import {HomepageCommandSchema,normalizeHomepageConfig,type HomepageConfig} from '@/src/lib/homepageContent';

export const getHomepageContent=cache(async():Promise<HomepageConfig|null>=>{
 try {const record=await getPrisma().homepageContent.findUnique({where:{key:'main'}});return record?.live?normalizeHomepageConfig(record.live):null;}
 catch {return null;} // The unchanged homepage remains available before optional CMS migration.
});
export const getHomepagePublicationDate=cache(async()=>{
 try{return (await getPrisma().homepageContent.findUnique({where:{key:'main'},select:{public_updated_at:true}}))?.public_updated_at||undefined;}
 catch{return undefined;}
});
export async function saveHomepageContent(input:unknown){
 const parsed=HomepageCommandSchema.safeParse(input);
 if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid homepage content.',400);
 const {action}=parsed.data,config=normalizeHomepageConfig(parsed.data.config);
 return getPrisma().$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended('homepage:main',0))`;
  const current=await tx.homepageContent.findUnique({where:{key:'main'}});
  const next=action==='restore'?normalizeHomepageConfig({}):config;
  const live=action==='draft'?undefined:next;
  const previous=current?.live?normalizeHomepageConfig(current.live):normalizeHomepageConfig({});
  const changed=live!==undefined&&JSON.stringify(previous)!==JSON.stringify(live);
  return tx.homepageContent.upsert({where:{key:'main'},create:{key:'main',draft:next,...(live!==undefined?{live}:{}),...(changed?{public_updated_at:new Date()}:{} )},update:{draft:next,...(live!==undefined?{live}:{}),...(changed?{public_updated_at:new Date()}:{} )}});
 });
}
