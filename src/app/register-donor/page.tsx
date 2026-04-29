import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Register as a Donor", description: "Register as a blood or organ donor on BloodNet and help build a global donor support network.", alternates: { canonical: "/register-donor" } };

export default function RegisterDonorPage() {
  return <SeoStaticPage eyebrow="Register donor" title="Register to Help Someone Tomorrow" description="Eligible users can register donor information, blood group, city, and availability preferences to help people find urgent support faster." />;
}
