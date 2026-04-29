import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Organ Donation Guide", description: "Ethical organ donation support guide for verified requests, registry pages, and lawful medical coordination.", alternates: { canonical: "/organ-donation-guide" } };

export default function OrganDonationGuidePage() {
  return <SeoStaticPage eyebrow="Guide" title="Organ Donation Guide" description="Learn how verified organ request pages work, what BloodNet can and cannot do, and why lawful medical supervision is required." />;
}
