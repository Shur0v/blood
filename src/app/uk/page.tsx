import type { Metadata } from "next";
import { HomeExperience } from "@/src/components/HomeExperience";

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
