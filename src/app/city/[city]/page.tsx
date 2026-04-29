import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SeoLocationLanding from "@/src/components/SeoLocationLanding";
import { getNetworkStats } from "@/src/backend/services/seoData";
import { cityFromSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
type Params = { city: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  const cityName = cityFromSlug(city);
  return {
    title: `Blood Donors in ${cityName} | Urgent Blood and Organ Donation Support`,
    description: `Find active blood donors, available blood groups, and verified organ donation support in ${cityName}. Search by blood group, city, and urgent need.`,
    alternates: { canonical: `/city/${city}` },
  };
}

export default async function CityLandingPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  const stats = await getNetworkStats(undefined, city);
  if (stats.totalDonors === 0) notFound();
  const cityName = stats.rows[0]?.city || cityFromSlug(city);
  return (
    <SeoLocationLanding
      citySlug={city}
      title={`Blood Donors in ${cityName}`}
      intro={`Find active blood donors, available blood groups, and verified organ donation support in ${cityName}. Search by blood group and urgent need through a free donor connection platform.`}
    />
  );
}
