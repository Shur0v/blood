import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const dynamic='force-dynamic';

export const metadata: Metadata = { title: "Request Blood Help", description: "Guidance for finding urgent blood donor support by blood group and city through BloodNet.", alternates: { canonical: "/request-blood" } };

export default function RequestBloodPage() {
  return <SeoStaticPage pageKey="request-blood" eyebrow="Request blood" title="Find Blood Help by City and Group" description="Search the BloodNet public pages by blood group and city, then coordinate with donors safely through approved contact rules." />;
}
