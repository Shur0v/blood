import type { Metadata } from "next";
import {HomePageExperience as HomeExperience} from '@/src/components/HomePageExperience';

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "United Kingdom Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in the United Kingdom through BloodNet.",
  alternates: { canonical: "/uk" },
};

export default function UnitedKingdomPage() {
  return <HomeExperience forcedCountry="United Kingdom" />;
}
