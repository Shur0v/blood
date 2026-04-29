import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "Safety Policy", description: "BloodNet safety rules for free donation support, privacy-safe contact, and anti-scam donor coordination.", alternates: { canonical: "/safety-policy" } };

export default function SafetyPolicyPage() {
  return <SeoStaticPage eyebrow="Safety" title="Safety Policy" description="BloodNet supports free voluntary donation connection only. Do not send advance payments. Coordinate blood donation at hospitals or licensed medical locations." />;
}
