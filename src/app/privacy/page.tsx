import type { Metadata } from "next";
import ServerPolicyPage from "@/src/components/ServerPolicyPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy | BloodNet",
  description:
    "BloodNet privacy policy for donor, recipient, location, contact, uploaded file, fraud-prevention, and safety data. Public donor pages are privacy-aware and private medical data is not public.",
  alternates: { canonical: "/privacy" },
  openGraph: {
    title: "BloodNet Privacy Policy",
    description:
      "Read how BloodNet handles donor, recipient, location, contact, and safety data for a free donor connection platform.",
    url: "/privacy",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "BloodNet Privacy Policy",
    description: "Privacy and public data boundaries for BloodNet donor connection pages.",
  },
};

export default function PrivacyPage() {
  return <ServerPolicyPage kind="privacy" />;
}
