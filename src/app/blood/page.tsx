import { HomeExperience } from "@/src/components/HomeExperience";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find Blood Donors by Blood Group and Location',
  description: 'Search BloodNet volunteer blood donors by blood group, city and country. Contact donors to confirm availability with your hospital.',
  alternates: { canonical: '/blood' },
};

export const dynamic = "force-dynamic";

export default function BloodIndexPage() {
  return <HomeExperience />;
}

