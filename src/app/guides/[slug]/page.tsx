import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { DONATION_GUIDES, getDonationGuide } from '@/src/lib/donationGuides';
import { GuideExperience } from '@/src/components/research/GuideExperience';
export const dynamic='force-dynamic';
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata>{const guide=getDonationGuide((await params).slug);if(!guide)return {title:'Guide not found',robots:{index:false,follow:true}};return {title:guide.title,description:guide.description,alternates:{canonical:`/guides/${guide.slug}`},openGraph:{title:guide.title,description:guide.description,type:'article',url:`/guides/${guide.slug}`,images:['/opengraph-image']},twitter:{card:'summary_large_image',title:guide.title,description:guide.description,images:['/opengraph-image']}};}
export default async function Page({params}:{params:Promise<{slug:string}>}){const guide=getDonationGuide((await params).slug);if(!guide)notFound();return <GuideExperience guide={guide} index={DONATION_GUIDES.indexOf(guide)}/>;}
