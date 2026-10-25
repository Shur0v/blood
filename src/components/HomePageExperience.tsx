import {getDonorLocations} from '@/src/backend/services/donorLocations';
import {regionalCopy} from '@/src/lib/regionalDesign';
import RegionalSeoFooter from './RegionalSeoFooter';
import {getRegionalContent} from '@/src/backend/services/regionalContent';
import type {ComponentProps} from 'react';
import {HomeExperience} from './HomeExperience';
import ImageSlider from './ImageSlider';
import {listHomepageSlides} from '@/src/backend/services/homepageSlides';
import {getPrisma} from '@/src/backend/config/db';
export async function HomePageExperience(props:ComponentProps<typeof HomeExperience>){
 let initialSlides;try{initialSlides=await listHomepageSlides(getPrisma());}catch{/* Existing client recovery stays available. */}
 const content=props.forcedCountry?await getRegionalContent(props.forcedCountry):null;
 return <HomeExperience {...props} regionalHeroContent={props.forcedCountry?{heading:regionalCopy(content?.design,'searchTitle',{country:props.forcedCountry},'Blood donor connections in '+props.forcedCountry),description:regionalCopy(content?.design,'searchText',{country:props.forcedCountry},'Explore recorded donor listings and the cities they serve. Local matches lead the search, with broader suggestions when needed. Confirm availability and hospital arrangements directly.')}:undefined} regionalFooter={props.regionalFooter!==undefined?props.regionalFooter:props.forcedCountry?<RegionalSeoFooter country={props.forcedCountry}/>:undefined} sliderContent={<ImageSlider initialSlides={initialSlides}/>}/>;
}

export async function countryLandingMetadata(country:string,path:string){let count:number|null=null;try{count=(await getDonorLocations()).filter(row=>row.country.toLowerCase()===country.toLowerCase()&&row.bloodCount>0).length;}catch{}return {title:country+' donor connections and free medical profiles',description:count===null?'Check BloodNet donor coverage and private medical-profile tools for '+country+'.':count?'Explore recorded donor listings serving '+count+' locations in '+country+'. Confirm availability directly.':'No blood-donor city listings are currently recorded in '+country+'. Explore global connections and free private medical-profile tools.',alternates:{canonical:path}};}
