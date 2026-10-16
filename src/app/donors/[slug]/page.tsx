import { donorLocationPath } from '@/src/backend/services/donorLocations';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublicDonorProfile } from '@/src/backend/services/publicDonorProfiles';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { stringifyJsonLd } from '@/src/lib/aiSeo';
export const dynamic = 'force-dynamic';
type Props = {params:Promise<{slug:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata> {
  const profile=await getPublicDonorProfile((await params).slug);
  if(!profile)return {title:'Donor profile unavailable',robots:{index:false,follow:false}};
  const title=`${profile.name} — volunteer blood donor in ${profile.city}`;
  const description=`${profile.name} has chosen to share a BloodNet donor profile in ${profile.city}, ${profile.country}.${profile.phone?` Public contact: ${profile.phone}.`:''} Coordinate through your hospital and confirm current availability.`;
  return {title,description,alternates:{canonical:`/donors/${profile.slug}`},openGraph:{title,description,type:'profile',url:`/donors/${profile.slug}`,images:['/opengraph-image']},twitter:{card:'summary_large_image',title,description}};
}
export default async function Page({params}:Props) {
  const profile=await getPublicDonorProfile((await params).slug);if(!profile)notFound();
  const url=getPublicBaseUrl()+`/donors/${profile.slug}`;
  return <main className="research-page"><div className="research-container">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd({'@context':'https://schema.org','@type':'ProfilePage',url,dateModified:profile.updatedAt.toISOString(),mainEntity:{'@type':'Person',name:profile.name,url,description:profile.bio,address:{'@type':'PostalAddress',addressLocality:profile.city,addressCountry:profile.country},...(profile.phone?{telephone:profile.phone}:{})}})}}/>
    <nav className="research-breadcrumb"><Link href="/">BloodNet</Link><span>/</span><Link href="/donors">Public volunteers</Link></nav>
    <header className="research-hero research-hero-split"><div><p className="research-kicker">Shared by the donor</p><h1>{profile.name}</h1><p className="research-lead">Volunteer blood donor · {profile.city}, {profile.country}</p><p className="research-small">This donor has chosen to make this profile searchable. It is not a clinical eligibility assessment or a promise of availability.</p></div><div className="research-profile-badge"><strong>{profile.bloodGroup}</strong><span>Self-reported blood group</span></div></header>
    <section className="research-surface"><p className="research-kicker">In their own words</p><h2>About my volunteering</h2><p className="research-prose whitespace-pre-wrap">{profile.bio}</p></section>
    <section className="research-grid two"><article className="research-surface"><h2>Coordinate a donation</h2>{profile.phone?<><p className="research-prose">The donor has separately consented to publish this contact number. Contact respectfully, explain the hospital's request, and accept a donor's decision to decline.</p><a className="research-button" href={`tel:${profile.phone.replace(/[^+0-9]/g,'')}`}>{profile.phone}</a></>:<p className="research-prose">The donor has not chosen to publish a phone number on this search profile. Use the existing BloodNet donor directory to review available contact options.</p>}<Link href={donorLocationPath({country:profile.country,city:profile.city},'blood')} className="research-text-link">Browse local donor listings →</Link></article><aside className="research-surface tint"><h2>Keep the hospital involved</h2><p className="research-prose">A listing is an expression of willingness. The collecting service confirms eligibility, tests donated blood and decides compatibility. Do not arrange an unregulated transfusion or offer payment in exchange for blood.</p><Link className="research-text-link" href="/guides/coordinate-an-urgent-blood-request">Read the coordination guide →</Link></aside></section>
    <footer className="research-surface"><h2>Profile transparency</h2><p className="research-prose">Introduction supplied by the donor. Profile preferences updated <time dateTime={profile.updatedAt.toISOString()}>{profile.updatedAt.toISOString().slice(0,10)}</time>. Publication may be withdrawn by the account holder. BloodNet does not certify medical fitness through this page.</p><Link href="/privacy" className="research-text-link">Privacy information</Link></footer>
  </div></main>;
}
