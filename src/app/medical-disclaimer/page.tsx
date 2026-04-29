import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Medical Disclaimer", description: "BloodNet is not a hospital and does not provide medical treatment, emergency service, or transplant approval.", alternates: { canonical: "/medical-disclaimer" } };

export default function MedicalDisclaimerPage() {
  return <SeoStaticPage eyebrow="Medical disclaimer" title="BloodNet Is a Connection Service" description="BloodNet does not provide diagnosis, treatment, ambulance service, blood bank inventory confirmation, or legal organ transplant approval. Always follow licensed medical guidance." />;
}
