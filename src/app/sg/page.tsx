import type { Metadata } from "next";
import SeoLocationLanding from "@/src/components/SeoLocationLanding";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Singapore Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in Singapore through BloodNet.",
  alternates: { canonical: "/sg" },
};

export default function SingaporeLandingPage() {
  return <SeoLocationLanding country="Singapore" title="Singapore Blood Donor Network" intro="Find active blood donors, available blood groups, city donor pages, and verified organ donation support in Singapore." />;
}
