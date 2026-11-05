import {cache} from 'react';
import {Prisma} from '@prisma/client';
import {getPrisma} from '../config/db';
import {getDonorLocations} from './donorLocations';
import {getRegionalContent} from './regionalContent';
import {MedicalError} from '../utils/medicalPrivacy';
import {validateImagePlacement} from './publicImages';
import {ADMIN_WORKSPACE} from '@/src/lib/adminNotifications';
import {INDIA_AREAS,INDIA_CITIES,indiaArea,indiaDirectoryArea,indiaSearchCopy,IndiaCommandSchema,IndiaConfigSchema,matchesIndiaCity,type IndiaArea,type IndiaConfig} from '@/src/lib/indiaLocal';
import {formatRegionalText} from '@/src/lib/regionalDesign';
import {INDIA_RECIPES} from '@/src/lib/indiaRecipes';
export async function indiaDirectoryMetadata(city:string,group?:string,mode:'blood'|'organ'='blood'){
 const area=indiaDirectoryArea(city),content=await indiaLocalContent(area,city),copy=indiaSearchCopy(area,group,mode),context={country:'India',city,group};
 return {title:formatRegionalText((content.config.sections?.introduction?.title||content.config.title||copy.title).replaceAll('{place}',area.name),context),description:copy.description};
}
export const getIndiaPublication=cache(async(id:string)=>{try{const row=await getPrisma().indiaEditorialPage.findUnique({where:{area_id:id}});const value=IndiaConfigSchema.safeParse(row?.live);return row?.published&&value.success?{config:value.data,modified:row.public_updated_at}:null;}catch{return null;}});
export async function publishedIndiaAreas(){try{const defaults=await getIndiaPublication('defaults');return (await getPrisma().indiaEditorialPage.findMany({where:{published:true,live:{not:Prisma.DbNull}},select:{area_id:true,public_updated_at:true}})).flatMap(row=>{const area=indiaArea(row.area_id);return area?[{...area,modified:new Date(Math.max(row.public_updated_at?.getTime()||0,defaults?.modified?.getTime()||0))}]:[];});}catch{return [];}}
export async function indiaEditorialDates(){try{return new Map((await getPrisma().indiaEditorialPage.findMany({where:{public_updated_at:{not:null}},select:{area_id:true,public_updated_at:true}})).map(row=>[row.area_id,row.public_updated_at!]));}catch{return new Map<string,Date>();}}
export function indiaEditorialModified(city:string,original:Date,dates:Map<string,Date>){return new Date(Math.max(original.getTime(),dates.get('defaults')?.getTime()||0,dates.get(indiaDirectoryArea(city).id)?.getTime()||0));}
export async function indiaEditorAreas(){const locations=(await getDonorLocations()).filter(row=>row.country.toLowerCase()==='india');return [...INDIA_AREAS,...locations.map(row=>indiaDirectoryArea(row.city)).filter((a,i,all)=>a.kind==='legacy'&&all.findIndex(b=>b.id===a.id)===i)];}
export async function saveIndiaContent(input:unknown){
 const parsed=IndiaCommandSchema.safeParse(input);if(!parsed.success)throw new MedicalError(parsed.error.issues[0]?.message||'Invalid India content.',400);
 const {areaId,action,config}=parsed.data;
 if(areaId!=='defaults'&&!(await indiaEditorAreas()).some(a=>a.id===areaId))throw new MedicalError('Choose a reviewed or recorded India area.',400);
 if(action==='publish'&&indiaArea(areaId)&&(!config.editorialNote||config.editorialNote.length<100))throw new MedicalError('Review and describe the local scope before publication (at least 100 characters).',400);
 for(const image of config.images||[])await validateImagePlacement(image);
 return getPrisma().$transaction(async tx=>{
  await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtextextended(${'india-editorial:'+areaId},0))`;
  const old=await tx.indiaEditorialPage.findUnique({where:{area_id:areaId}}),live=action==='publish'?config:action==='restore'?{}:undefined,published=action==='withdraw'||action==='restore'?false:action==='publish'?true:old?.published||false;
  const changed=action!=='draft'&&(published!==Boolean(old?.published)||(live!==undefined&&JSON.stringify(old?.live||{})!==JSON.stringify(live)));
  const values={draft:action==='restore'?{}:config,...(live!==undefined?{live}:{}),published,...(changed?{public_updated_at:new Date()}:{} )};
  const row=await tx.indiaEditorialPage.upsert({where:{area_id:areaId},create:{area_id:areaId,...values},update:values});
  if(changed)await tx.adminNotification.create({data:{type:'india.editorial.published',family:'publishing',title:'India local page publication changed',detail:`${areaId}: ${published?'published':'withdrawn'}.`,country:'India',href:ADMIN_WORKSPACE+'#editor-india-local',dedupe_key:`india:${areaId}:${row.updated_at.toISOString()}`}});
  return row;
 });
}
export async function indiaLocalContent(area:IndiaArea,city?:string,preview?:IndiaConfig){
 const locations=city&&area.kind==='city'?(await getDonorLocations()).filter(row=>row.country.toLowerCase()==='india'):[];
 const regionalCity=city&&area.kind==='city'?(locations.find(row=>row.city.toLowerCase()===city.toLowerCase())||locations.find(row=>area.aliases.some(alias=>alias.toLowerCase()===row.city.toLowerCase())))?.city||city:city;
 const [defaults,local,regional]=await Promise.all([getIndiaPublication('defaults'),getIndiaPublication(area.id),getRegionalContent('India',regionalCity)]);
 const sections:NonNullable<IndiaConfig['sections']>={};
 const base:IndiaConfig={...defaults?.config};
 for(const values of [base.sections])for(const [id,value]of Object.entries(values||{}))sections[id]={...value};
 const copy=regional?.design?.copy;
 const inherited:IndiaConfig={...(copy?.introTitle?{title:copy.introTitle}:{}),...(copy?.introText?{introduction:copy.introText}:{}),...(regional?.design?.faqs?{faqs:regional.design.faqs}:{} )};
 if(copy?.searchTitle||copy?.searchText)sections.search={...sections.search,...(copy.searchTitle?{title:copy.searchTitle}:{}),...(copy.searchText?{text:copy.searchText}:{})};
 const override=preview??local?.config??{};
 for(const [id,value]of Object.entries(override.sections||{}))sections[id]={...sections[id],...value};
 const config={...base,...inherited,...override,sections};
 // A default recipe only governs new, unreviewed locations; reviewed recipes stay area-specific.
 if(INDIA_RECIPES[area.id]&&!override.recipe)delete config.recipe;
 const hidden=regional?.design?.hiddenSections||[];
 const map:Record<string,string[]>= {gallery:['regional-update'],locations:['location-index','same-state','state-navigator','group-links','published-reading','organization-explorer','next-step'],faq:['local-faq','definition-disclosures','scope-facts'],join:['limited-coverage','signup-journey','first-profile','resident-invitation','closing-invitation'],guidance:['official-directory','source-provenance','screening-path','published-reading'],home5:['broader-flow'],home9:['service-status'],home12:['response-expectations']};
 for(const key of hidden)for(const id of map[key]||[])if(override.sections?.[id]?.hidden===undefined)sections[id]={...sections[id],hidden:true};
 return {config,regional,modified:new Date(Math.max(defaults?.modified?.getTime()||0,local?.modified?.getTime()||0,regional?new Date(regional.updatedAt).getTime():0))};
}
export type IndiaCoverage={registered:number;manual:number;organizations:number;worldwide:number;unresolved:number;available:boolean};
export const indiaCoverage=cache(async(area:IndiaArea,legacy=false):Promise<IndiaCoverage>=>{
 try{
 const cities=area.kind==='state'&&!legacy?INDIA_CITIES.filter(city=>city.stateId===area.id):[area];
 const labels=[...new Set([...cities.flatMap(city=>city.aliases),...(area.kind==='state'?area.aliases:[])].map(value=>value.toLowerCase()))];
 const rows=await getPrisma().$queryRaw<Array<{kind:string;key:string;city:string;lat:number|null;lng:number|null}>>`WITH locations AS (
 SELECT 'registered' AS kind,u.id AS key,u.location_city AS city,u.location_country AS country,u.location_lat AS lat,u.location_lng AS lng FROM "User" u WHERE u.is_active_donor=true
 UNION ALL SELECT 'registered',u.id,sc.city,sc.country,sc.lat,sc.lng FROM "UserServiceCity" sc JOIN "User" u ON u.id=sc.user_id WHERE u.is_active_donor=true
 UNION ALL SELECT 'manual',id,location_city,location_country,location_lat,location_lng FROM "ManualBloodDonor" WHERE is_active_donor=true
 UNION ALL SELECT 'organizations',id,location_city,location_country,location_lat,location_lng FROM "CommunityDonor" WHERE is_active=true
 ) SELECT kind,key,city,lat,lng FROM locations WHERE LOWER(TRIM(country))='india' AND LOWER(TRIM(city)) IN (${Prisma.join(labels)})`;
 const mapped=legacy||area.kind==='legacy'?rows:rows.filter(row=>cities.some(city=>matchesIndiaCity(city,row)));
 const n=(kind:string)=>new Set(mapped.filter(r=>r.kind===kind).map(r=>r.key)).size;
 return {registered:n('registered'),manual:n('manual'),organizations:n('organizations'),worldwide:await getPrisma().user.count(),unresolved:rows.length-mapped.length,available:true};
 }catch{return {registered:0,manual:0,organizations:0,worldwide:0,unresolved:0,available:false};}
});
