import type { Metadata } from "next";
import ServerPolicyPage from "@/src/components/ServerPolicyPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy | BloodNet",
  description:
    "BloodNet privacy policy for donor, recipient, location, contact, uploaded file, fraud-prevention, and platform safety data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyAliasPage() {
  return <ServerPolicyPage kind="privacy" />;
}
