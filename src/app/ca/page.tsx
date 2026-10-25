import {HomePageExperience,countryLandingMetadata} from '@/src/components/HomePageExperience';
export const dynamic='force-dynamic';
export async function generateMetadata(){return countryLandingMetadata('Canada','/ca');}
export default function Page(){return <HomePageExperience forcedCountry="Canada"/>;}
