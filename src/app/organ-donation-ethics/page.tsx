import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Organ Donation Ethics", description: "BloodNet organ donation ethics policy: lawful, verified, medically supervised connection only. No organ trade.", alternates: { canonical: "/organ-donation-ethics" } };

export default function OrganDonationEthicsPage() {
  return <SeoStaticPage eyebrow="Organ ethics" title="Ethical Organ Donation Support" description="Organ selling, buying, brokering, bidding, or trading is strictly prohibited. BloodNet only supports verified, lawful, free donation awareness and connection." />;
}
