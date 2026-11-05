import {cache} from 'react';
import {Prisma} from '@prisma/client';
import {getPrisma} from '../config/db';
import {MedicalError} from '../utils/medicalPrivacy';
import {UsaCommandSchema,UsaConfigSchema,USA_AREAS,usaArea,type UsaArea,type UsaConfig} from '@/src/lib/usaEdition';
import {getRegionalContent} from './regionalContent';
import {formatRegionalText} from '@/src/lib/regionalDesign';
import {ADMIN_WORKSPACE} from '@/src/lib/adminNotifications';
import {usaRecordMatchesArea} from '@/src/lib/usaGeography';
import {validateImagePlacement} from './publicImages';

export const getUsaPublication=cache(async(areaId:string)=>{
  try{const row=await getPrisma().usaEditorialPage.findUnique({where:{area_id:areaId}});if(!row?.published||!row.live)return null;const parsed=UsaConfigSchema.safeParse(row.live);return parsed.success?{config:parsed.data,modified:row.public_updated_at}:null;}catch{return null;}
});
export async function listPublishedUsaAreas(){
  try{return (await getPrisma().usaEditorialPage.findMany({where:{published:true,live:{not:Prisma.DbNull}},select:{area_id:true,public_updated_at:true}})).flatMap(row=>{const area=usaArea(row.area_id);return area?[{...area,modified:row.public_updated_at}]:[];});}catch{return [];}
}
export async function saveUsaContent(input:unknown){
  const parsed=UsaCommandSchema.safeParse(input);if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid USA content.',400);
  const {areaId,action,config}=parsed.data;
  for(const image of config.images||[])await validateImagePlacement(image);
  if(action==='publish'&&areaId!=='country'&&(!config.editorialNote||config.editorialNote.length<80))throw new MedicalError('Review and describe the area context before publishing (at least 80 characters).',400);
  return getPrisma().$transaction(async tx=>{
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${'usa-editorial:'+areaId},0))`;
    const current=await tx.usaEditorialPage.findUnique({where:{area_id:areaId}});
    const live=action==='publish'?config:action==='restore'?{}:undefined;
    const published=action==='withdraw'?false:action==='publish'?true:action==='restore'?areaId==='country':current?.published||false;
    const changed=action!=='draft'&&(published!==Boolean(current?.published)||(live!==undefined&&JSON.stringify(current?.live||{})!==JSON.stringify(live)));
    const row=await tx.usaEditorialPage.upsert({where:{area_id:areaId},create:{area_id:areaId,draft:action==='restore'?{}:config,...(live!==undefined?{live}:{}),published,...(changed?{public_updated_at:new Date()}:{} )},update:{draft:action==='restore'?{}:config,...(live!==undefined?{live}:{}),published,...(changed?{public_updated_at:new Date()}:{} )}});
    if(changed)await tx.adminNotification.create({data:{type:'usa.editorial.published',family:'publishing',title:'USA editorial publication changed',detail:`${areaId}: ${published?'published':'withdrawn'}.`,country:'United States',href:ADMIN_WORKSPACE+'#editor-usa',dedupe_key:`usa:${areaId}:${row.updated_at.toISOString()}`}});
    return row;
  });
}
export async function usaContent(area?:UsaArea,preview?:UsaConfig){
  const [country,local,regional]=await Promise.all([getUsaPublication('country'),area?getUsaPublication(area.id):null,getRegionalContent('United States',area?.kind==='city'?area.directoryCities[0]:undefined)]);
  const countryConfig=country?.config||{},areaConfig=preview||local?.config||{};
  const context={country:'United States',city:area?.name};
  const copy=regional?.design?.copy;
  const inherited:UsaConfig={title:copy?.introTitle,introduction:copy?.introText,sections:{...(copy?.searchTitle||copy?.searchText?{search:{title:copy.searchTitle,text:copy.searchText}}:{}),...(copy?.locationsTitle||copy?.locationsText?{locations:{title:copy.locationsTitle,text:copy.locationsText}}:{}),...(copy?.joinTitle||copy?.joinText?{community:{title:copy.joinTitle,text:copy.joinText}}:{})}};
  const mergedSections:NonNullable<UsaConfig['sections']>={};
  for(const values of [inherited.sections,countryConfig.sections,areaConfig.sections])for(const [id,value]of Object.entries(values||{}))mergedSections[id]={...mergedSections[id],...value};
  const config={...inherited,...countryConfig,...areaConfig,sections:mergedSections} as UsaConfig;
  const fill=(text:string|undefined)=>text?formatRegionalText(text.replaceAll('{place}',area?.name||'United States'),context):text;
  config.title=fill(config.title);config.introduction=fill(config.introduction);config.editorialNote=fill(config.editorialNote);
  for(const [id,value]of Object.entries(config.sections||{}))config.sections![id]={...value,title:fill(value.title),text:fill(value.text)};
  if(regional?.design){regional.design={...regional.design,copy:Object.fromEntries(Object.entries(regional.design.copy||{}).map(([id,text])=>[id,fill(text)])),faqs:regional.design.faqs?.map(f=>({question:fill(f.question)!,answer:fill(f.answer)!}))};}
  return {config,regional,modified:local?.modified||country?.modified||null};
}

export type UsaCoverage={registered:number;manual:number;organizations:number;worldwide:number;available:boolean;unresolved:number};
// Primary and service-city registrations are de-duplicated by account, never summed by city.
export const getUsaCoverage=cache(async(area?:UsaArea):Promise<UsaCoverage>=>{
  try{
    const cities=area?.directoryCities.map(city=>city.toLowerCase())||[];
    const whereCity=cities.length?Prisma.sql`AND LOWER(TRIM(city)) IN (${Prisma.join(cities)})`:Prisma.empty;
    const rows=await getPrisma().$queryRaw<Array<{kind:string;key:string;city:string;lat:number;lng:number}>>`
      WITH locations AS (
        SELECT 'registered' AS kind,u.id AS key,u.location_city AS city,u.location_country AS country,u.location_lat AS lat,u.location_lng AS lng FROM "User" u WHERE u.is_active_donor=true
        UNION ALL SELECT 'registered',u.id,sc.city,sc.country,sc.lat,sc.lng FROM "UserServiceCity" sc JOIN "User" u ON u.id=sc.user_id WHERE u.is_active_donor=true
        UNION ALL SELECT 'manual',id,location_city,location_country,location_lat,location_lng FROM "ManualBloodDonor" WHERE is_active_donor=true
        UNION ALL SELECT 'organizations',id,location_city,location_country,location_lat,location_lng FROM "CommunityDonor" WHERE is_active=true
      ) SELECT kind,key,city,lat,lng FROM locations WHERE LOWER(TRIM(country))='united states' ${whereCity}`;
    const worldwide=await getPrisma().user.count();
    const mapped=area?rows.filter(row=>usaRecordMatchesArea(area,row)):rows;
    const n=(kind:string)=>new Set(mapped.filter(row=>row.kind===kind).map(row=>row.key)).size;
    return {registered:n('registered'),manual:n('manual'),organizations:n('organizations'),worldwide,available:true,unresolved:area?rows.length-mapped.length:0};
  }catch{return {registered:0,manual:0,organizations:0,worldwide:0,available:false,unresolved:0};}
});
