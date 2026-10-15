import type { Metadata } from 'next';
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';
export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title:'Blood and organ donors by city', description:'Browse cities with active blood donors and organ donor pledges. Find location-specific donor listings and blood groups on BloodNet.', alternates:{canonical:'/cities'} };
export default function Page() { return <main className="min-h-screen bg-bg py-14"><header className="mx-auto max-w-7xl px-4"><h1 className="text-4xl font-semibold text-slate-900">Active donor cities</h1><p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">These locations come from active donor entries and service cities in the BloodNet network.</p></header><DonorLocationDirectory/></main>; }
