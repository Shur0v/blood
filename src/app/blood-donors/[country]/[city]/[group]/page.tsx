import { notFound } from 'next/navigation';
import { bloodGroupFromSlug } from '@/src/lib/seoRouting';
import DonorLocationLanding,{donorLocationMetadata} from '@/src/components/DonorLocationLanding';
export const dynamic='force-dynamic';
type Params={country:string;city:string;group:string};
export async function generateMetadata({params}:{params:Promise<Params>}){const values=await params,group=bloodGroupFromSlug(values.group);if(!group)return {title:'Blood group not found',robots:{index:false,follow:true}};return donorLocationMetadata(values,'blood',group);}
export default async function Page({params}:{params:Promise<Params>}){const values=await params,group=bloodGroupFromSlug(values.group);if(!group)notFound();return <DonorLocationLanding params={values} mode="blood" bloodGroup={group}/>;}
