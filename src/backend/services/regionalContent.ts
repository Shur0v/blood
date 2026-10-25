import {getPrisma} from '../config/db';
import {toLocationSlug} from '../utils/locationSlug';
import {RegionalContentSchema,REGIONAL_CITY_REVISION,type PublicRegionalContent} from '@/src/lib/regionalContent';
import {getDonorLocations} from './donorLocations';
import {MedicalError} from '../utils/medicalPrivacy';
export const regionalContentKey=(country:string,city?:string|null)=>`${toLocationSlug(country)}:${city?toLocationSlug(city):'*'}`;
type PublicationDates=Map<string,{updatedAt:Date;published:boolean}>;
export async function getRegionalPublicationDates(){
 try{return new Map((await getPrisma().regionalPageContent.findMany({where:{public_updated_at:{not:null},country:{equals:'Nepal',mode:'insensitive'}},select:{key:true,public_updated_at:true,published:true}})).map(row=>[row.key,{updatedAt:row.public_updated_at!,published:row.published}])) as PublicationDates;}
 catch{return new Map() as PublicationDates;}
}
export function regionalLastModified(country:string,city:string|undefined,original:Date,dates:PublicationDates){
 if(country.toLowerCase()!=='nepal')return original;
 const cityDate=dates.get(regionalContentKey(country,city)),countryDate=dates.get(regionalContentKey(country));
 return new Date(Math.max(original.getTime(),new Date(REGIONAL_CITY_REVISION).getTime(),cityDate?.updatedAt.getTime()||0,cityDate?.published?0:countryDate?.updatedAt.getTime()||0));
}
const slideSignature=(slides:unknown)=>JSON.stringify(slides,(_key,value)=>value&&typeof value==='object'&&!Array.isArray(value)?Object.fromEntries(Object.entries(value).sort(([a],[b])=>a.localeCompare(b))):value);

export async function saveRegionalContent(input:unknown){
 const parsed=RegionalContentSchema.safeParse(input);
 if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid regional content.',400);
 const value=parsed.data,locations=await getDonorLocations();
 const location=locations.find(row=>toLocationSlug(row.country)===toLocationSlug(value.country)&&(!value.city||toLocationSlug(row.city)===toLocationSlug(value.city)));
 if(!location)throw new MedicalError('Choose a country and city with recorded donor coverage.',400);
 const country=location.country,city=value.city?location.city:null,key=regionalContentKey(country,city);
 if(country.toLowerCase()!=='nepal'&&value.published)throw new MedicalError('Nepal is the first live regional edition. Save other countries as drafts until their edition is enabled.',400);
 const ids=[...new Set(value.slides.map(slide=>slide.assetId))];
 const assets=await getPrisma().mediaAsset.findMany({where:{id:{in:ids},category:'SLIDER',mime_type:'image/webp'},select:{id:true}});
 if(assets.length!==ids.length)throw new MedicalError('Use regional images uploaded with the administrator image uploader.',400);
 return getPrisma().$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${key},0))`;
  const current=await tx.regionalPageContent.findUnique({where:{key}});
  const changed=!current||current.title!==value.title||current.summary!==value.summary||slideSignature(current.slides)!==slideSignature(value.slides);
  const liveChanged=(Boolean(current?.published)||value.published)&&(current?.published!==value.published||(value.published&&changed));
  const publicDate=liveChanged?{public_updated_at:new Date()}:{};
  return tx.regionalPageContent.upsert({where:{key},create:{...value,country,city,key,...publicDate},update:{...value,country,city,...publicDate}});
 });
}

export async function getRegionalContent(country:string,city?:string):Promise<PublicRegionalContent|null>{
 try{
  const records=await getPrisma().regionalPageContent.findMany({where:{key:{in:[regionalContentKey(country,city),regionalContentKey(country)]},published:true}});
  const record=records.find(row=>row.key===regionalContentKey(country,city))||records.find(row=>row.key===regionalContentKey(country));
  if(!record)return null;
  const value=RegionalContentSchema.safeParse({country:record.country,city:record.city,title:record.title,summary:record.summary,published:true,slides:record.slides});
  if(!value.success)return null;
  const assets=await getPrisma().mediaAsset.findMany({where:{id:{in:value.data.slides.map(slide=>slide.assetId)},category:'SLIDER',mime_type:'image/webp'},select:{id:true,public_url:true,width:true,height:true}});
  return {title:record.title,summary:record.summary,updatedAt:(record.public_updated_at||record.updated_at).toISOString(),slides:value.data.slides.flatMap(slide=>{const asset=assets.find(row=>row.id===slide.assetId);return asset?[{...slide,url:asset.public_url,width:asset.width,height:asset.height}]:[];})};
 }catch{return null;} // Pre-migration build/unavailable optional content must not hide donor search.
}
