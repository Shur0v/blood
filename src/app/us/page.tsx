import type { Metadata } from "next";
import UsaExperience from '@/src/components/usa/UsaExperience';

export const revalidate = 1800;
export const dynamic = "force-dynamic";
const title="USA Blood Donor Directory and Free Medical Profiles";
const description="Join the USA BloodNet community. Explore labelled donor and organization contacts, register to participate locally, and keep your own medical records in a free private profile.";
export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/us" },
  openGraph:{title,description,url:'/us',type:'website',locale:'en_US',images:['/opengraph-image']},
  twitter:{card:'summary_large_image',title,description,images:['/opengraph-image']},
};

export default function UnitedStatesPage() {
  return <UsaExperience/>;
}
