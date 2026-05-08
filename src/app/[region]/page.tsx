import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomeExperience } from "@/src/components/HomeExperience";
import { getRegionBySlug } from "@/src/lib/regions";
import { buildRegionalFaqSchema, stringifyJsonLd } from "@/src/lib/aiSeo";
import { getPublicBaseUrl } from "@/src/backend/config/env";

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

  const baseUrl = getPublicBaseUrl().replace(/\/$/, "");
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${config.country} Emergency Blood Donor Pages`,
    url: `${baseUrl}/${config.slug}`,
    about: [
      { "@type": "Thing", name: "Blood donation" },
      { "@type": "Thing", name: "Emergency blood donation" },
      { "@type": "Thing", name: "Organ donor registry" },
    ],
    inLanguage: "en",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: stringifyJsonLd([
            collectionSchema,
            buildRegionalFaqSchema(config.country, config.slug),
          ]),
        }}
      />
      <HomeExperience forcedCountry={config.country} />
    </>
  );
}
