import OrganDiscoveryPage,{organPageData} from '@/src/components/OrganDiscoveryPage';
export const dynamic='force-dynamic';
type Props={params:Promise<{organType:string;city?:string}>};
export async function generateMetadata({params}:Props){const value=await params,data=await organPageData(value.organType,value.city,true);return {title:data.title,description:'Explore recorded voluntary organ pledges and administrator-reviewed requests, with clinical coordination guidance.',alternates:{canonical:data.path}};}
export default async function Page({params}:Props){const value=await params;return <OrganDiscoveryPage organType={value.organType} city={value.city} request={true}/>;}
