import type { Metadata } from "next";
import { CityBloodSeoPage } from "@/src/components/ProgrammaticBloodSeoPage";
import { getCityBloodSummary } from "@/src/backend/services/seoData";
import { cityFromSlug } from "@/src/lib/seoRouting";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

type Params = { city: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { city } = await params;
  try {
    const rows = await getCityBloodSummary(city);
    const cityName = rows[0]?.city || cityFromSlug(city);
    const country = rows[0]?.country;
    return {
      title: `Blood Donors in ${cityName} | Urgent Blood and Organ Donation Support`,
      description: `Find active blood donors${country ? ` in ${cityName}, ${country}` : ` in ${cityName}`}. Search by blood group, city, and urgent need through BloodNet.`,
      alternates: { canonical: `/city/${city.toLowerCase()}` },
      robots: rows.length ? { index: true, follow: true } : { index: false, follow: true },
    };
  } catch {
    return {
      title: `Blood Donors in ${cityFromSlug(city)} | Urgent Blood Support`,
      robots: { index: false, follow: true },
    };
  }
}

export default async function CityLandingPage({ params }: { params: Promise<Params> }) {
  const { city } = await params;
  return <CityBloodSeoPage citySlug={city.toLowerCase()} />;
}
