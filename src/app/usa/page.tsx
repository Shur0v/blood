import type { Metadata } from "next";
import { HomeExperience } from "@/src/components/HomeExperience";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "USA Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in United States through BloodNet.",
  alternates: { canonical: "/usa" },
};

export default function RegionLandingPage() {
  return <HomeExperience forcedCountry="United States" />;
}
