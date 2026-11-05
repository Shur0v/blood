import type {Metadata} from 'next';
import type {UsaArea,UsaConfig} from './usaEdition';

export const USA_GUIDANCE_REVIEWED='2026-11-06';
// Search intents describe real page functions; they are not volume estimates or a keyword meta tag.
export function usaSearchIntent(area:UsaArea){
 const place=area.kind==='city'?`${area.name}, ${area.stateCode}`:area.name;
 return {primary:`blood donor directory in ${place}`,supporting:[`register as a blood donor in ${area.name}`,`blood donor contacts in ${area.name}`,'free private medical profile','blood donation eligibility guidance']};
}
export function usaAreaHeading(area:UsaArea){return `Blood donor connections in ${area.name}${area.kind==='city'?', '+area.state:''}`;}
export function usaAreaIntroduction(area:UsaArea){return `Explore recorded blood donor and organization contacts, or register to help build the ${area.name} donor community. ${area.context}`;}
export function usaAreaMetadata(area:UsaArea,config:UsaConfig={}):Metadata{
 const place=area.kind==='city'?`${area.name}, ${area.stateCode}`:area.name;
 const title=config.sections?.hero?.title||config.title||`Blood Donor Directory in ${place}`;
 const description=`Explore ${area.name} blood donor and organization contacts, register as a local donor, and learn about free private medical profiles. Availability must be confirmed.`;
 return {title,description,alternates:{canonical:area.path},openGraph:{title,description,url:area.path,type:'website',locale:'en_US'},twitter:{card:'summary_large_image',title,description},robots:{index:true,follow:true}};
}
export function usaDirectorySearchCopy(city:string,mode:'blood'|'organ',group?:string){
 // Legacy directories do not have a trustworthy state field. Do not infer state from a city name.
 const place=`${city}, USA`;
 return mode==='organ'?{title:`Organ Pledge Directory in ${place}`,description:`Explore recorded organ pledges in ${place}. BloodNet does not allocate organs or arrange transplantation; use authorized medical services for clinical decisions.`}:{title:`${group?group+' ':''}Blood Donor Directory in ${place}`,description:`Browse ${group?group+' ':''}blood donor and organization entries in ${place}. Check each record's source and location, confirm availability, or register to participate locally.`};
}
export function usaAreaQuestions(area:UsaArea){
 return [
  {question:`How do I find blood donor contacts in ${area.name}?`,answer:`Use the blood-group and location filters, then read each card's actual city and source label. Registered accounts, manual individual entries and organization listings are different record types. A directory entry does not confirm that blood or an individual donor is available.`},
  {question:area.kind==='state'?'Does this page cover all of California?':`Does the ${area.name} directory cover the surrounding region?`,answer:area.context},
  {question:`Can registering in ${area.name} book a blood donation?`,answer:'No. BloodNet registration makes your participation details available under the existing privacy controls. Donation screening, eligibility and scheduling belong to the collecting service. Read the FDA donation information and confirm arrangements directly with that service.'},
 ];
}
