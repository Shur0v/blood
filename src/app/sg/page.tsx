import {HomePageExperience,countryLandingMetadata} from '@/src/components/HomePageExperience';
export const dynamic='force-dynamic';
export async function generateMetadata(){return countryLandingMetadata('Singapore','/sg');}
export default function Page(){return <HomePageExperience forcedCountry="Singapore"/>;}
