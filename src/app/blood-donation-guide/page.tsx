import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Blood Donation Guide", description: "Helpful guidance on blood donation, eligibility, emergency donor search, and privacy-safe coordination.", alternates: { canonical: "/blood-donation-guide" } };

export default function BloodDonationGuidePage() {
  return <SeoStaticPage eyebrow="Guide" title="Blood Donation Guide" description="Learn how blood donor search works, why blood group and city matching matters, and how to coordinate safely with hospitals and verified donors." />;
}
