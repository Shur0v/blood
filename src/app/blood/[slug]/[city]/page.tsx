import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BloodGroupCitySeoPage } from "@/src/components/ProgrammaticBloodSeoPage";
import { getBloodDonorsByGroupAndCity } from "@/src/backend/services/seoData";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { bloodGroupFromSlug, cityFromSlug } from "@/src/lib/seoRouting";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

type Params = { slug: string; city: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug, city } = await params;
  const bloodGroup = bloodGroupFromSlug(slug);
  if (!bloodGroup) {
    return { title: "Blood donor page not found", robots: { index: false, follow: true } };
  }

  try {
    const donors = await getBloodDonorsByGroupAndCity(bloodGroup, city);
    if (!donors.length) {
      return {
        title: `${bloodGroup} Blood Donors in ${cityFromSlug(city)}`,
        description: `No active public ${bloodGroup} donor entries are currently available for ${cityFromSlug(city)}.`,
        robots: { index: false, follow: true },
      };
    }
    const locationCity = donors[0].location_city;
    const country = donors[0].location_country;
    const path = `/blood/${slug.toLowerCase()}/${city.toLowerCase()}`;
    const url = `${getPublicBaseUrl().replace(/\/$/, "")}${path}`;
    return {
      title: `Urgent ${bloodGroup} Blood Donors in ${locationCity} | Find Active Donors`,
      description: `Find registered ${bloodGroup} blood donors in ${locationCity}, ${country}. Search active blood donors by city and blood group for urgent emergency support.`,
      keywords: [
        `urgent ${bloodGroup} blood ${locationCity}`,
        `${bloodGroup} donor ${locationCity}`,
        `emergency blood donor ${locationCity}`,
        "blood donor near me",
        "find blood donor fast",
        "blood needed urgently",
      ],
      alternates: { canonical: path },
      openGraph: {
        title: `Urgent ${bloodGroup} Blood Donors in ${locationCity}`,
        description: `View active ${bloodGroup} donor entries and emergency blood donor guidance for ${locationCity}.`,
        url,
        type: "website",
      },
      twitter: {
        card: "summary_large_image",
        title: `Urgent ${bloodGroup} Blood Donors in ${locationCity}`,
        description: `Find active ${bloodGroup} donor support in ${locationCity}, ${country}.`,
      },
    };
  } catch {
    return {
      title: `Urgent ${bloodGroup} Blood Donors in ${cityFromSlug(city)} | Find Active Donors`,
      robots: { index: false, follow: true },
    };
  }
}

export default async function BloodGroupCityPage({ params }: { params: Promise<Params> }) {
  const { slug, city } = await params;
  const bloodGroup = bloodGroupFromSlug(slug);
  if (!bloodGroup) notFound();
  return <BloodGroupCitySeoPage bloodGroup={bloodGroup} citySlug={city.toLowerCase()} />;
}
