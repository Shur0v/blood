import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "About BloodNet", description: "BloodNet is a free global blood donor, organ donor, and patient connection platform.", alternates: { canonical: "/about" } };

export default function AboutPage() {
  return (
    <SeoStaticPage eyebrow="About BloodNet" title="A Global Donor Connection Network" description="BloodNet connects patients, families, registered donors, and supporters through privacy-aware public donor pages and verified organ request registry pages.">
      <p>Our vision is to build the biggest blood and organ donor network ever, with a proper matching solution for urgent real-world needs.</p>
      <p>BloodNet is a matching and coordination platform only. Donation decisions must remain free, lawful, ethical, and medically supervised.</p>
    </SeoStaticPage>
  );
}
