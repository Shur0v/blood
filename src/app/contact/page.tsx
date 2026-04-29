import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Contact BloodNet", description: "Contact BloodNet for donor support, safety reports, platform questions, and verified request help.", alternates: { canonical: "/contact" } };

export default function ContactPage() {
  return <SeoStaticPage eyebrow="Contact" title="Contact BloodNet" description="For urgent medical emergencies, contact a hospital or local emergency service first. For platform support, donor reports, or verification questions, use official BloodNet contact channels listed on the website." />;
}
