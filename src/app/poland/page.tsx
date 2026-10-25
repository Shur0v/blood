import type { Metadata } from "next";
import {HomePageExperience as HomeExperience} from '@/src/components/HomePageExperience';

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Poland Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in Poland through BloodNet.",
  alternates: { canonical: "/poland" },
};

export default function RegionLandingPage() {
  return <HomeExperience forcedCountry="Poland" />;
}
