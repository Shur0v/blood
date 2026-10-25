import {OrganRequestDetail} from '@/src/components/OrganDiscoveryPage';
import {getVerifiedOrganRequestBySlug} from '@/src/backend/services/seoData';
export const dynamic='force-dynamic';
type Props={params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props){const {slug}=await params,row=await getVerifiedOrganRequestBySlug(slug);return row?{title:row.organ_type+' request in '+row.location_city,alternates:{canonical:'/organ/request/details/'+slug}}:{title:'Request unavailable',robots:{index:false}};}
export default async function Page({params}:Props){return <OrganRequestDetail slug={(await params).slug}/>;}
