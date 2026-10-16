import { cache } from 'react';
import { getDonorLocations, type DonorLocation } from './donorLocations';
import { getActiveBloodDonorCounts } from './donorCounts';

export type ResearchMetric = {label:string;value:number;note:string};
export type ResearchSnapshot = {available:boolean;metrics:ResearchMetric[];locations:DonorLocation[];retrievedAt:string;recordUpdatedAt:string|null};
export const getResearchSnapshot = cache(async ():Promise<ResearchSnapshot>=>{
  const retrievedAt=new Date().toISOString();
  try {
    const [counts,locations]=await Promise.all([getActiveBloodDonorCounts(),getDonorLocations()]);
    return {available:true,locations,retrievedAt,recordUpdatedAt:locations.length?new Date(Math.max(...locations.map(row=>row.updatedAt.getTime()))).toISOString():null,
      metrics:[
        {label:'Worldwide active entries',value:counts.total,note:'Active registered, manual and community source entries, counted once per listing.'},
        {label:'Active registered accounts',value:counts.registered,note:'Registered accounts with active donor status; not completed donations.'},
        {label:'Manual donor entries',value:counts.manual,note:'Active manually maintained blood listings.'},
        {label:'Community listings',value:counts.community,note:'Active organisation or community listings; not a headcount of individuals.'},
        {label:'Cities represented',value:locations.length,note:'Country/city pairs with participating blood or organ entries.'},
      ]};
  }catch{return {available:false,locations:[],metrics:[],retrievedAt,recordUpdatedAt:null};}
});

export function locationCommentary(row:DonorLocation,all:DonorLocation[],mode:'blood'|'organ') {
  const country=all.filter(other=>other.country===row.country),count=mode==='blood'?row.bloodCount:row.organCount;
  const categories=mode==='blood'?row.bloodGroups:row.organs;
  const covered=country.filter(other=>(mode==='blood'?other.bloodCount:other.organCount)>0);
  return [
    {title:`What the ${row.city} count measures`,text:`This snapshot contains ${count.toLocaleString()} active ${mode} donor ${count===1?'entry':'entries'} serving ${row.city}, ${row.country}. Registered volunteers can appear through their primary location or a selected service city. Other source types can also contribute listings. The number describes entries available for discovery in this location; it is not a count of completed donations, clinically assessed donors or available blood units. Use the cards on this page to review actual entries rather than treating the total as a confirmed supply for a hospital request.`},
    {title:`Categories represented in this local directory`,text:`The ${row.city} listings currently represent ${categories.length} ${mode==='blood'?'recorded blood-group categories':'normalised donation categories'}${categories.length?`: ${categories.join(', ')}`:'. Some contributed entries may not include a usable category'}. These are categories in a voluntary directory, not measurements of their prevalence in the city’s population. A category label is useful for organising contact, but it cannot establish clinical compatibility or eligibility. ${mode==='blood'?'Ask the collecting service to confirm the requested component, screening and testing pathway.':'A pledge is willingness only; an authorised transplant service must assess consent, suitability and the lawful pathway.'}`},
    {title:`How ${row.city} fits within ${row.country} coverage`,text:`There are ${covered.length.toLocaleString()} country/city pairs with ${mode} entries in the current ${row.country} directory. This is platform coverage, not a representative national survey. A volunteer who offers service in several cities can be included on more than one location page, so adding every city total would overstate an unduplicated person count. Nearby-city links give you practical ways to explore the recorded network. They do not establish journey times, hospital collection capacity or permission to arrange donation outside an authorised service.`},
    {title:'What the update date can tell you',text:`The latest recorded change included in this location summary is dated ${row.updatedAt.toISOString().slice(0,10)}. That timestamp can reflect a profile, pledge or service-location change. It is not a new clinical assessment and does not confirm that every listed person is currently available to answer a message. The page reads the current directory data rather than inventing a recent donation date. If an arrangement matters for a specific time, confirm willingness and logistics directly, and use the collecting or transplant service’s process for the clinical decision.`},
    {title:'Move from local discovery to a responsible next step',text:`Start by confirming the hospital’s actual request, then review the relevant category and the location printed on each card. Contact people respectfully and share only the details needed to discuss the request. A person may decline or be unable to travel, even when their entry appears active. Keep medical documents within an appropriate confidential care process. If ${row.city} has limited matching entries, explore other recorded locations with the hospital’s guidance rather than assuming a wider result guarantees an immediate solution. BloodNet supports communication; it does not certify medical suitability or deliver an emergency service.`},
  ];
}
