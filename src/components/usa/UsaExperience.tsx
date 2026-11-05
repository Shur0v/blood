import Link from 'next/link';
import {usaAreaHeading} from '@/src/lib/usaSeo';
import {notFound} from 'next/navigation';
import {USA_MAIN_IDS,USA_REVIEW_DATE,usaArea,type UsaConfig,type UsaArea} from '@/src/lib/usaEdition';
import {usaContent,getUsaCoverage,listPublishedUsaAreas,getUsaPublication} from '@/src/backend/services/usaContent';
import {getDonorLocations} from '@/src/backend/services/donorLocations';
import {getPublicBaseUrl} from '@/src/backend/config/env';
import {stringifyJsonLd} from '@/src/lib/aiSeo';
import {resolveRegionalDesign} from '@/src/lib/regionalDesign';
import {USA_MAIN_COMPONENTS} from './UsaMainSections';
import {USA_LOCAL_COMPONENTS} from './UsaLocalSections';
import type {UsaContext} from './types';
import DonorDiscoveryPanel from '../DonorDiscoveryPanel';
import type {CSSProperties} from 'react';
import {getManagedImage} from '@/src/backend/services/publicImages';
export default async function UsaExperience({area,preview}:{area?:UsaArea;preview?:UsaConfig}){
 if(area&&preview===undefined&&!(await getUsaPublication(area.id)))notFound();
 const [content,coverage,locations,publishedAreas]=await Promise.all([usaContent(area,preview),getUsaCoverage(area),getDonorLocations().catch(()=>[]),listPublishedUsaAreas()]);
 const context:UsaContext={area,place:area?.name||'United States',config:content.config,coverage,locations:locations.filter(row=>row.country.toLowerCase()==='united states'),publishedAreas,regional:content.regional,preview:preview!==undefined};
 context.images=content.regional?.design?.hiddenSections?.includes('gallery')?[]:(await Promise.all((content.config.images||[]).map(async placement=>{const image=await getManagedImage(placement.assetId);return image?{image,placement}:null;}))).filter((image):image is NonNullable<typeof image>=>Boolean(image));
 const {colors}=resolveRegionalDesign('United States',content.regional?.design);
 const style={'--us-paper':colors.paper,'--us-ink':colors.ink,'--us-blue':colors.indigo,'--us-red':colors.accent} as CSSProperties;
 const path=area?.path||'/us';
 const hidden=content.regional?.design?.hiddenSections||[];
 const inheritedHidden:Record<string,string[]>={locations:['locations','nearby-cities','state-connections','group-links','location-explorer'],home5:['signup','matching','search-walkthrough','broader-flow'],join:['participation','benefits','community','closing','participation-gap','contribution-checklist','account-benefits','first-registration','individuals','families','students','workplaces','organizers','local-closing'],guidance:['reports','prescriptions','donation','official-resources','source-notes','reviewed-guidance','reading-links','report-organization','prescription-context','appointment-preparation'],home9:['prescriptions'],faq:['questions','local-questions','registration-questions','concerns']};
 const sections={...context.config.sections};for(const key of hidden)for(const id of inheritedHidden[key]||[])if(sections[id]?.hidden===undefined)sections[id]={...sections[id],hidden:true};context.config={...context.config,sections};
 return <main className="usa-page" data-usa-edition={area?.id||'country'} style={style}>
  <script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd([{'@context':'https://schema.org','@type':'CollectionPage',name:context.config.sections?.hero?.title||context.config.title||(area?usaAreaHeading(area):'BloodNet United States blood donor directory'),url:getPublicBaseUrl()+path,dateModified:content.modified?.toISOString()||USA_REVIEW_DATE,inLanguage:'en-US',publisher:{'@id':getPublicBaseUrl()+'#medical-org'},about:[{'@type':'Thing',name:'Blood donor directory'},{'@type':'Thing',name:'Voluntary donor registration'},{'@type':'Thing',name:'Private medical profiles'}],spatialCoverage:{'@type':area?.kind==='state'?'State':'Place',name:area?area.name+', '+area.state:'United States'}},{'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{'@type':'ListItem',position:1,name:'BloodNet',item:getPublicBaseUrl()+'/'},{'@type':'ListItem',position:2,name:'United States',item:getPublicBaseUrl()+'/us'},...(area?[{'@type':'ListItem',position:3,name:area.name,item:getPublicBaseUrl()+area.path}]:[])]}])}}/>
  {preview!==undefined&&<aside className="us-preview" role="status">Administrator draft preview · unpublished changes · excluded from search</aside>}
  {area?<><USA_MAIN_COMPONENTS.hero context={context}/><USA_MAIN_COMPONENTS.search context={context}/>{(context.config.recipe||area.recipe).map(id=>{const Component=USA_LOCAL_COMPONENTS[id];return <Component key={id} context={context}/>;})}</>:USA_MAIN_IDS.map(id=>{const Component=USA_MAIN_COMPONENTS[id];return <Component key={id} context={context}/>;})}
  <DonorDiscoveryPanel forcedCountry="United States"/>
  <footer className="us-footer"><Link href="/us">BloodNet / USA</Link><nav aria-label="USA service information"><Link href="/about">About</Link><Link href="/statistics">Statistics</Link><Link href="/safety-policy">Safety</Link><Link href="/privacy-policy">Privacy</Link><Link href="/terms">Terms</Link></nav><p>Community connections. Private records. No guarantee of availability or medical eligibility.</p></footer>
 </main>;
}
