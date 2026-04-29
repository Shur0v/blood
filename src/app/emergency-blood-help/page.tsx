import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Emergency Blood Help", description: "What to do when blood is needed urgently and how to search BloodNet donor pages by city and group.", alternates: { canonical: "/emergency-blood-help" } };

export default function EmergencyBloodHelpPage() {
  return <SeoStaticPage eyebrow="Emergency guide" title="How to Find Blood Help Fast" description="Contact hospitals and local emergency services first, then use BloodNet to search active donor pages by blood group and city for additional community support." />;
}
