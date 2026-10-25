import {getManagedImage} from './publicImages';
import {cache} from 'react';
import {getPrisma} from '../config/db';
import {toLocationSlug} from '../utils/locationSlug';
import {RegionalContentSchema,REGIONAL_CITY_REVISION,GLOBAL_CITY_REVISION,type PublicRegionalContent} from '@/src/lib/regionalContent';
import {getDonorLocations} from './donorLocations';
import {MedicalError} from '../utils/medicalPrivacy';
import {normalizeRegionalDesign,regionalDesignContrastError} from '@/src/lib/regionalDesign';
export const regionalContentKey=(country:string,city?:string|null)=>`${toLocationSlug(country)}:${city?toLocationSlug(city):'*'}`;
type PublicationDates=Map<string,{updatedAt:Date;published:boolean}>;
export async function getRegionalPublicationDates(){
 try{const db=getPrisma();const [regions,services]=await Promise.all([db.regionalPageContent.findMany({where:{public_updated_at:{not:null}},select:{key:true,public_updated_at:true,published:true}}),db.serviceAvailability.findMany({where:{public_updated_at:{not:null}},select:{key:true,public_updated_at:true,live:true}}).catch(()=>[])]);return new Map([...regions.map(row=>[row.key,{updatedAt:row.public_updated_at!,published:row.published}] as const),...services.map(row=>['service:'+row.key,{updatedAt:row.public_updated_at!,published:row.live!==null}] as const)]) as PublicationDates;}
 catch{return new Map() as PublicationDates;}
}

export function regionalLastModified(country:string,city:string|undefined,original:Date,dates:PublicationDates){
 const cityDate=dates.get(regionalContentKey(country,city)),countryDate=dates.get(regionalContentKey(country)),serviceCity=city?dates.get('service:'+regionalContentKey(country,city)):undefined,serviceCountry=dates.get('service:'+regionalContentKey(country));
 return new Date(Math.max(original.getTime(),new Date(GLOBAL_CITY_REVISION).getTime(),cityDate?.updatedAt.getTime()||0,cityDate?.published?0:countryDate?.updatedAt.getTime()||0,serviceCity?.updatedAt.getTime()||0,serviceCity?.published?0:serviceCountry?.updatedAt.getTime()||0));
}
const slideSignature=(slides:unknown)=>JSON.stringify(slides,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);

export async function saveRegionalContent(input:unknown){
 const parsed=RegionalContentSchema.safeParse(input);
 if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid regional content.',400);
 const value=parsed.data,locations=await getDonorLocations();
 const location=locations.find(row=>toLocationSlug(row.country)===toLocationSlug(value.country)&&(!value.city||toLocationSlug(row.city)===toLocationSlug(value.city)));
 if(!location)throw new MedicalError('Choose a country and city with recorded donor coverage.',400);
 const country=location.country,city=value.city?location.city:null,key=regionalContentKey(country,city);
 const ids=[...new Set(value.slides.map(slide=>slide.assetId))];
 const assets=await getPrisma().mediaAsset.findMany({where:{id:{in:ids},category:'SLIDER',mime_type:'image/webp'},select:{id:true}});
 if(assets.length!==ids.length)throw new MedicalError('Use regional images uploaded with the administrator image uploader.',400);
 return getPrisma().$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${key},0))`;
  const current=await tx.regionalPageContent.findUnique({where:{key}});
  const design=normalizeRegionalDesign(country,value.design??current?.design??{});
  const contrastError=regionalDesignContrastError(country,design);
  if(contrastError)throw new MedicalError(contrastError,400);
  const changed=!current||current.title!==value.title||current.summary!==value.summary||slideSignature(current.slides)!==slideSignature(value.slides)||slideSignature(current.design)!==slideSignature(design);
  const liveChanged=(Boolean(current?.published)||value.published)&&(current?.published!==value.published||(value.published&&changed));
  const publicDate=liveChanged?{public_updated_at:new Date()}:{};
  return tx.regionalPageContent.upsert({where:{key},create:{...value,design,country,city,key,...publicDate},update:{...value,design,country,city,...publicDate}});
 });
}

export const getRegionalContent=cache(async function getRegionalContent(country:string,city?:string):Promise<PublicRegionalContent|null>{
 try{
  const records=await getPrisma().regionalPageContent.findMany({where:{key:{in:[regionalContentKey(country,city),regionalContentKey(country)]},published:true}});
  const record=records.find(row=>row.key===regionalContentKey(country,city))||records.find(row=>row.key===regionalContentKey(country));
  if(!record)return null;
  const value=RegionalContentSchema.safeParse({country:record.country,city:record.city,title:record.title,summary:record.summary,published:true,slides:record.slides,design:record.design});
  if(!value.success)return null;
  const assets=await getPrisma().mediaAsset.findMany({where:{id:{in:value.data.slides.map(slide=>slide.assetId)},category:'SLIDER',mime_type:'image/webp'},select:{id:true,public_url:true,width:true,height:true}});
  const managed=await Promise.all(value.data.slides.map(slide=>getManagedImage(slide.assetId)));
  return {title:record.title,summary:record.summary,design:value.data.design,updatedAt:(record.public_updated_at||record.updated_at).toISOString(),slides:value.data.slides.flatMap(slide=>{const asset=assets.find(row=>row.id===slide.assetId);return asset?[{...slide,url:asset.public_url,width:asset.width,height:asset.height,managed:managed.find(image=>image?.id===asset.id)||undefined}]:[];})};
 }catch{return null;} // Pre-migration build/unavailable optional content must not hide donor search.
});
