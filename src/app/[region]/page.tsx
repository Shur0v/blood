import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeExperience } from "@/src/app/page";
import { getRegionBySlug } from "@/src/lib/regions";

type Params = { region: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { region } = await params;
  const config = getRegionBySlug(region);
  if (!config) {
    return {};
  }

  const country = config.country;
  return {
    title: `${country} Blood Donor List | Emergency Blood & Organ Donors`,
    description: `Blood donor list in major cities of ${country}. Find emergency blood donors by blood group and verified organ donor support in ${country}.`,
    keywords: [
      `Blood donor list in Dhaka, ${country}`,
      `Blood donor list in Karachi, ${country}`,
      `Emergency O+ donors in ${country}`,
      `Emergency AB- donors in ${country}`,
      `Emergency blood donors in ${country}`,
    ],
    alternates: { canonical: `/${config.slug}` },
    openGraph: {
      title: `${country} Blood Donor List | BloodNet`,
      description: `Emergency blood donor list in ${country} with city-level search and verified donor support.`,
      url: `https://bloodnet.live/${config.slug}`,
    },
  };
}

export default async function RegionalLandingPage({ params }: { params: Promise<Params> }) {
  const { region } = await params;
  const config = getRegionBySlug(region);
  if (!config) {
    notFound();
  }

  return <HomeExperience forcedCountry={config.country} />;
}
