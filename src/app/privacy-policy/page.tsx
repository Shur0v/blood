import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "BloodNet privacy policy for donor, recipient, location, contact, and platform safety data.",
  alternates: { canonical: "/privacy-policy" },
};

export default function PrivacyPolicyAliasPage() {
  redirect("/privacy");
}
