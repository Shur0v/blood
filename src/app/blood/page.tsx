import Hero from '@/src/components/Hero';
import {ServiceInvitation} from '@/src/components/PublicServiceContent';
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Blood Donors by Blood Group and Location',
  description: 'Search BloodNet volunteer blood donors by blood group, city and country. Contact donors to confirm availability with your hospital.',
  alternates: { canonical: '/blood' },
};

export const dynamic = "force-dynamic";

export default function BloodIndexPage() {
  return <main><Hero contentOverride={{heading:"Find blood donors by group and location",description:"Search recorded local entries first, then explore broader suggestions while keeping your selected blood group. Confirm availability and collection arrangements directly."}}/><section className="mx-auto max-w-7xl px-4 pb-24"><DonorLocationDirectory limit={24}/><ServiceInvitation context="donor"/></section></main>;
}

