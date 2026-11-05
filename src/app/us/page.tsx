import type { Metadata } from "next";
import UsaExperience from '@/src/components/usa/UsaExperience';

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "United States donor community and free medical profiles",
  description: "Join the USA BloodNet community. Explore labelled donor and organization contacts, register to participate locally, and keep your own medical records in a free private profile.",
  alternates: { canonical: "/us" },
};

export default function UnitedStatesPage() {
  return <UsaExperience/>;
}
