import type { Metadata } from "next";
import SeoLocationLanding from "@/src/components/SeoLocationLanding";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Philippines Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in the Philippines through BloodNet.",
  alternates: { canonical: "/ph" },
};

export default function PhilippinesLandingPage() {
  return <SeoLocationLanding country="Philippines" title="Philippines Blood Donor Network" intro="Find active blood donors, available blood groups, city donor pages, and verified organ donation support across the Philippines." />;
}
