import type { DonorLocation } from '@/src/backend/services/donorLocations';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { bloodGroupToSlug } from './seoRouting';
const words=(text:string)=>' '+text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu,' ').trim()+' ';
export function keywordGuideDestination(keyword:string) {
  const text=keyword.toLowerCase();
  if(/privacy|phone number|contact number|donor name/.test(text))return '/guides/donor-privacy-and-public-profiles';
  if(/organ|kidney|liver|transplant|cornea|bone marrow/.test(text))return '/guides/understand-organ-donation-pledges';
  if(/urgent|emergency|needed|need blood/.test(text))return '/guides/coordinate-an-urgent-blood-request';
  if(/eligib|who can|first time|requirements|prepare/.test(text))return '/guides/first-time-donor-planning';
  if(/register|join|become|volunteer|save lives/.test(text))return '/guides/build-a-community-donor-network';
  if(/group|positive|negative|compatib/.test(text))return '/guides/understand-blood-group-search';
  return '/guides/find-blood-donors-near-you';
}
export function keywordDestination(keyword:string,locations:DonorLocation[]) {
  const text=words(keyword),organ=/organ|kidney|liver|transplant|cornea|bone marrow/i.test(keyword);
  const countries=[...new Set(locations.map(row=>row.country))].filter(country=>text.includes(words(country)));
  const matches=locations.filter(row=>text.includes(words(row.city))&&(!countries.length||countries.includes(row.country))&&(organ?row.organCount>0:row.bloodCount>0));
  if(matches.length===1){const row=matches[0],base=`/${organ?'organ':'blood'}-donors/${toLocationSlug(row.country)}/${toLocationSlug(row.city)}`;
    const group=keyword.toUpperCase().match(/\b(AB|A|B|O)\s*(POSITIVE|NEGATIVE|\+|-)/);
    if(!organ&&group){const bloodGroup=group[1]+(/NEGATIVE|-/.test(group[2])?'-':'+');if(row.bloodGroups.includes(bloodGroup))return base+'/'+bloodGroupToSlug(bloodGroup);return '/guides/understand-blood-group-search';}
    return base;
  }
  if(countries.length===1)return '/network/'+toLocationSlug(countries[0]);
  return keywordGuideDestination(keyword);
}
