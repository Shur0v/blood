import type { Metadata } from "next";
import SeoStaticPage from "@/src/components/SeoStaticPage";

export const metadata: Metadata = { title: "How BloodNet Works", description: "Learn how BloodNet helps people search by blood group, city, donor availability, and verified organ request data.", alternates: { canonical: "/how-it-works" } };

export default function HowItWorksPage() {
  return <SeoStaticPage eyebrow="How it works" title="Search, Match, Coordinate Safely" description="Users can search donor pages by city and blood group, review privacy-safe donor cards, and use verified organ request registry pages where available." />;
}
