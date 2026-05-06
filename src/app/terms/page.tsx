import type { Metadata } from "next";
import ServerPolicyPage from "@/src/components/ServerPolicyPage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions | BloodNet",
  description:
    "BloodNet terms and safety rules for lawful donor connection, free donation support, anti-scam coordination, medical supervision, and organ donation ethics.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return <ServerPolicyPage kind="terms" />;
}
