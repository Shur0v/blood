import type { Metadata } from "next";
import SeoLocationLanding from "@/src/components/SeoLocationLanding";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Canada Blood Donor Network | Find Urgent Donor Support",
  description: "Find active blood donors and verified organ donation support in Canada through BloodNet.",
  alternates: { canonical: "/ca" },
};

export default function CanadaLandingPage() {
  return <SeoLocationLanding country="Canada" title="Canada Blood Donor Network" intro="Find active blood donors, available blood groups, city donor pages, and verified organ donation support across Canada." />;
}
