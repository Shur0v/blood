import type { Metadata } from "next";
import SeoLocationLanding from "@/src/components/SeoLocationLanding";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "India Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in India through BloodNet.",
  alternates: { canonical: "/in" },
};

export default function IndiaLandingPage() {
  return <SeoLocationLanding country="India" title="India Blood Donor Network" intro="Find active blood donors, available blood groups, city donor pages, and verified organ donation support across India." />;
}
