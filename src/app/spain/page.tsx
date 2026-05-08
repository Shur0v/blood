import type { Metadata } from "next";
import { HomeExperience } from "@/src/components/HomeExperience";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Spain Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in Spain through BloodNet.",
  alternates: { canonical: "/spain" },
};

export default function RegionLandingPage() {
  return <HomeExperience forcedCountry="Spain" />;
}
