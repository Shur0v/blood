import { donorLocationPath } from '@/src/backend/services/donorLocations';
import type { Metadata } from 'next';
import PublicDonorArticle from '@/src/components/PublicDonorArticle';
import '../donor-profile.css';
import { notFound } from 'next/navigation';
import { getPublicDonorProfile } from '@/src/backend/services/publicDonorProfiles';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { stringifyJsonLd } from '@/src/lib/aiSeo';
export const dynamic = 'force-dynamic';
type Props = {params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const profile=await getPublicDonorProfile((await params).slug);
  if(!profile)return {title:'Donor profile unavailable',robots:{index:false,follow:false}};
  const title=`${profile.name} — ${profile.bloodGroup} blood donor in ${profile.city}`;
  const description=`${profile.name} is listed in the BloodNet donor directory in ${profile.city}, ${profile.country}.${profile.phone?` Public contact: ${profile.phone}.`:''} Coordinate through your hospital and confirm current availability.`;
  return {title,description,alternates:{canonical:`/donors/${profile.slug}`},openGraph:{title,description,type:'profile',url:`/donors/${profile.slug}`,images:['/opengraph-image']},twitter:{card:'summary_large_image',title,description}};
}
export default async function Page({params}:Props) {
  const profile=await getPublicDonorProfile((await params).slug);if(!profile)notFound();
  const url=getPublicBaseUrl()+`/donors/${profile.slug}`;
  return <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd({'@context':'https://schema.org','@type':'ProfilePage',url,dateModified:profile.updatedAt.toISOString(),mainEntity:{'@type':'Person',name:profile.name,url,description:profile.bio,address:{'@type':'PostalAddress',addressLocality:profile.city,addressCountry:profile.country},...(profile.phone?{telephone:profile.phone}:{})}})}}/>
    <PublicDonorArticle profile={profile} localPath={donorLocationPath({country:profile.country,city:profile.city},'blood')}/>
  </>;
}
