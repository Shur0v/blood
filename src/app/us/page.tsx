import type { Metadata } from "next";
import RegionalSeoFooter from '@/src/components/RegionalSeoFooter';
import DonorLocationDirectory from '@/src/components/DonorLocationDirectory';
import {HomePageExperience as HomeExperience} from '@/src/components/HomePageExperience';

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "United States blood donor directory",
  description: "Find blood donor listings and organ donation coordination in the United States through BloodNet.",
  alternates: { canonical: "/us" },
};

export default function UnitedStatesPage() {
  return <HomeExperience forcedCountry="United States" regionalFooter={<RegionalSeoFooter country="United States"/>} locationDirectory={<DonorLocationDirectory country="United States" limit={24}/>}/>;
}
