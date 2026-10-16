import {notFound,permanentRedirect} from 'next/navigation';
import {getDonorLocations} from '@/src/backend/services/donorLocations';
import {toLocationSlug} from '@/src/backend/utils/locationSlug';
export const dynamic='force-dynamic';
const countries:Record<string,string>={usa:'United States',uk:'United Kingdom',spain:'Spain',netherlands:'Netherlands',italy:'Italy',poland:'Poland',australia:'Australia'};
export default async function Page({params}:{params:Promise<{country:string}>}){const country=countries[(await params).country];if(!country)notFound();let present=false;try{present=(await getDonorLocations()).some(row=>row.country.toLowerCase()===country.toLowerCase());}catch{}permanentRedirect(present?'/network/'+toLocationSlug(country):'/network');}
