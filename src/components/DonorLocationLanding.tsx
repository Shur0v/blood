import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { donorLocationPath, findDonorLocation, getDonorLocations, getLocationDonorPreview, getLocationBloodGroupCounts } from '@/src/backend/services/donorLocations';
import { bloodGroupToSlug } from '@/src/lib/seoRouting';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { stringifyJsonLd } from '@/src/lib/aiSeo';
import CityLandingDonorGrid from './CityLandingDonorGrid';
import RegionalCityExperience from './regional/RegionalCityExperience';
import {RegionalAuthActions} from './regional/RegionalInteractions';
import {getRegionalContent} from '@/src/backend/services/regionalContent';
import {regionalCopy} from '@/src/lib/regionalDesign';
import { locationCommentary } from '@/src/backend/services/donorResearch';

export type LocationParams = { country: string; city: string };
export async function donorLocationMetadata(params: LocationParams, mode: 'blood'|'organ', bloodGroup?:string): Promise<Metadata> {
  let row = await findDonorLocation(params.country, params.city);
  if(row&&bloodGroup){const count=(await getLocationBloodGroupCounts(row.country,row.city))[bloodGroup]||0;row={...row,bloodCount:count,bloodGroups:[bloodGroup]};}
  if (!row || !(mode === 'blood' ? row.bloodCount : row.organCount)) return { title: 'Donor location not found', robots: { index: false, follow: true } };
  const title = `${bloodGroup?bloodGroup+' ':''}${mode === 'blood' ? 'Blood' : 'Organ'} donors in ${row.city}, ${row.country}`;
  const description = mode === 'blood'
    ? `Find active blood donor entries in ${row.city}, ${row.country}${row.bloodGroups.length ? ` for ${row.bloodGroups.join(', ')}` : ''}. Search local volunteers and coordinate donation with your hospital.`
    : `Find organ donor pledges in ${row.city}, ${row.country}${row.organs.length ? ` for ${row.organs.join(', ')}` : ''}. Coordinate through licensed hospitals and lawful transplant services.`;
  const path = donorLocationPath(row, mode)+(bloodGroup?`/${bloodGroupToSlug(bloodGroup)}`:'');
  return { title, description, alternates: { canonical: path }, robots: { index: true, follow: true },
    openGraph: { title, description, url: path, type: 'website', images: ['/opengraph-image'] },
    twitter: { card: 'summary_large_image', title, description, images: ['/opengraph-image'] } };
}

export default async function DonorLocationLanding({params,mode,bloodGroup}:{params:LocationParams;mode:'blood'|'organ';bloodGroup?:string}) {
  let row = await findDonorLocation(params.country, params.city);
  if(row&&bloodGroup){const count=(await getLocationBloodGroupCounts(row.country,row.city))[bloodGroup]||0;row={...row,bloodCount:count,bloodGroups:[bloodGroup]};}
  if (!row || !(mode === 'blood' ? row.bloodCount : row.organCount)) notFound();
  const count = mode === 'blood' ? row.bloodCount : row.organCount;
  const path = donorLocationPath(row, mode)+(bloodGroup?`/${bloodGroupToSlug(bloodGroup)}`:''), url = getPublicBaseUrl() + path;
  const title = `${bloodGroup?bloodGroup+' ':''}${mode === 'blood' ? 'Blood' : 'Organ'} donors in ${row.city}, ${row.country}`;
  const design=mode==='blood'?(await getRegionalContent(row.country,row.city))?.design:undefined,context={country:row.country,city:row.city,group:bloodGroup};
  const introduction = (
    <section data-region-section={mode==='blood'?'1':undefined} className="mx-auto max-w-7xl px-4 pt-12 pb-8">
      <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-3 text-sm text-slate-600"><Link href="/">Home</Link><span>/</span><Link href="/cities">Donor locations</Link><span>/ {row.city}, {row.country}</span></nav>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-5xl">{regionalCopy(design,'introTitle',context,title)}</h1>
      <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">{mode==='blood' ? regionalCopy(design,'introText',context,`Search ${count.toLocaleString()} active blood donor entries serving ${row.city}, ${row.country}. Contact volunteers through the donor cards and confirm availability before arranging a hospital visit.`) : `Browse ${count.toLocaleString()} active organ donor entries serving ${row.city}, ${row.country}. A pledge expresses willingness; eligibility, consent and matching must be confirmed by licensed transplant professionals.`}</p>
      <p className="mt-4 text-sm text-slate-600">{mode==='blood' ? `Blood groups represented: ${row.bloodGroups.join(', ') || 'Community blood support'}.` : `Donation categories: ${row.organs.join(', ')}.`}</p>
      <p className="mt-2 text-xs text-slate-500">Directory updated <time dateTime={row.updatedAt.toISOString()}>{row.updatedAt.toISOString().slice(0,10)}</time>. Listings are volunteer entries; availability is not guaranteed.</p>
      <div className="mt-6 flex flex-wrap gap-3"><Link href="/register-donor" className="rounded-full bg-rose-700 px-5 py-3 text-sm font-semibold text-white">Register as a donor</Link>{(mode==='blood'?row.organCount:row.bloodCount)>0&&<Link href={donorLocationPath(row,mode==='blood'?'organ':'blood')} className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold">{mode==='blood'?'Organ':'Blood'} donors in {row.city}</Link>}<Link href="/safety-policy" className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold">Donation safety</Link></div>
      {mode==='blood'&&<div className="mt-6"><RegionalAuthActions appearance="original"/></div>}
    </section>
  );
  if(mode==='blood')return <RegionalCityExperience country={row.country} city={row.city} group={bloodGroup} canonicalPath={donorLocationPath(row,'blood')+(bloodGroup?'/'+bloodGroupToSlug(bloodGroup):'')} title={title} introduction={introduction}/>;
  const nearby = (await getDonorLocations()).filter(other => other.country === row.country && other.city !== row.city && other.organCount).slice(0,24);
  const preview = await getLocationDonorPreview(row.country,row.city,mode,bloodGroup);
  const schema = [{ '@context':'https://schema.org', '@type':'CollectionPage', name:title, url, description:`${count} active ${mode} donor entries serving ${row.city}, ${row.country}.`, dateModified:row.updatedAt.toISOString(), spatialCoverage:{'@type':'Place',name:`${row.city}, ${row.country}`}, isPartOf:{'@id':`${getPublicBaseUrl()}#website`} },
    { '@context':'https://schema.org', '@type':'BreadcrumbList', itemListElement:[{ '@type':'ListItem',position:1,name:'BloodNet',item:getPublicBaseUrl() },{ '@type':'ListItem',position:2,name:'Donor locations',item:getPublicBaseUrl()+'/cities' },{ '@type':'ListItem',position:3,name:`${row.city}, ${row.country}`,item:url }] }];
  return <main className="min-h-screen bg-bg text-slate-900">
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd(schema)}}/>
    {introduction}
    {preview.length>0&&<section aria-labelledby="recent-local-donors" className="mx-auto max-w-7xl px-4 pb-8"><h2 id="recent-local-donors" className="text-xl font-semibold">Recent donor entries in {row.city}</h2><p className="mt-2 text-sm text-slate-600">A sample of public entries. Use the donor cards below to contact volunteers and check availability.</p><ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{preview.map((donor,index)=><li key={index} className="rounded-xl border border-slate-200 bg-white p-4 text-sm"><p className="font-semibold text-slate-900">{donor.name}</p><p className="mt-2 text-rose-700">{donor.category}</p><p className="mt-1 text-slate-600">{row.city}, {row.country}</p></li>)}</ul></section>}
    <CityLandingDonorGrid mode={mode} city={row.city} country={row.country} bloodGroup={bloodGroup}/>
    <section className="research-page"><div className="research-container"><p className="research-kicker">The local picture, explained</p><h2>Read the {row.city} directory with context.</h2><div className="research-chapters columns">{locationCommentary(row,await getDonorLocations(),mode).map(chapter=><article key={chapter.title}><header><h3>{chapter.title}</h3></header><p className="research-prose">{chapter.text}</p></article>)}</div><div className="research-grid two"><Link className="research-text-link" href="/guides/read-donor-data-responsibly">How these counts are defined →</Link><Link className="research-text-link" href="/guides/understand-organ-donation-pledges">A practical guide to the next step →</Link></div><p className="research-small">Source: current BloodNet directory records. This is platform coverage, not a representative survey or clinical assessment.</p></div></section>
    <section className="mx-auto max-w-7xl px-4 pb-16"><h2 className="text-2xl font-semibold">Donation support in {row.city}</h2><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">BloodNet helps people discover willing donors. For a medical emergency, contact your hospital or local emergency services first. Never buy or sell blood or organs, and confirm identity and medical requirements with your care team.</p>{nearby.length>0&&<><h2 className="mt-10 text-2xl font-semibold">More donor locations in {row.country}</h2><ul className="mt-5 grid gap-3 sm:grid-cols-3">{nearby.map(other=><li key={other.city}><Link href={donorLocationPath(other,mode)} className="block rounded-xl border border-slate-200 bg-white p-4 text-sm font-medium">Organ donors in {other.city}</Link></li>)}</ul></>}</section>
  </main>;
}
