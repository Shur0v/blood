import type { Metadata } from "next";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import CityLandingDonorGrid from "@/src/components/CityLandingDonorGrid";
import { fromLocationSlug } from "@/src/backend/utils/locationSlug";

interface Props {
  params: Promise<{ country: string; city: string }>;
}

const getExactOrganCityCount = async (city: string, country: string): Promise<number> => {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT (
      (SELECT COUNT(*) FROM "OrganPledge" op
        JOIN "User" u ON u.id = op.user_id
        JOIN "UserServiceCity" usc ON usc.user_id = u.id
        WHERE op.is_active = true
          AND u.is_active_donor = true
          AND LOWER(usc.city) = LOWER(${city})
          AND LOWER(usc.country) = LOWER(${country}))
      +
      (SELECT COUNT(*) FROM "ManualOrganDonor" mod
        WHERE LOWER(mod.location_city) = LOWER(${city})
          AND LOWER(mod.location_country) = LOWER(${country}))
    ) AS total
  `;
  const val = rows[0]?.total ?? 0;
  return typeof val === "bigint" ? Number(val) : Number(val);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const city = fromLocationSlug(p.city);
  const country = fromLocationSlug(p.country);
  const exactCount = await getExactOrganCityCount(city, country);
  const baseUrl = getPublicBaseUrl();
  const canonical = `${baseUrl}/organ-donors/${p.country}/${p.city}`;
  const title = `Emergency Organ Donation in ${city} | Organ Donor in ${city} | BloodNet`;
  const description = `Find emergency organ donation support in ${city}, ${country}. Organ donor listing is ranked by nearest city and country availability.`;
  const keywords = [
    `emergency organ donation in ${city}`,
    `organ donor in ${city}`,
    `urgent organ donor in ${city}`,
    `organ donation in ${country}`,
    `find organ donor near ${city}`,
  ];

  return {
    title,
    description,
    keywords,
    alternates: { canonical },
    robots: exactCount === 0 ? { index: false, follow: true } : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function OrganCityLandingPage({ params }: Props) {
  const p = await params;
  const city = fromLocationSlug(p.city);
  const country = fromLocationSlug(p.country);
  const baseUrl = getPublicBaseUrl();
  const canonical = `${baseUrl}/organ-donors/${p.country}/${p.city}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How to find emergency organ donation support in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `This page prioritizes organ donor cards from ${city}, then nearby country matches to keep the donor feed available.`,
        },
      },
      {
        "@type": "Question",
        name: `Does BloodNet support organ selling?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Organ selling, buying, and brokering are crimes. BloodNet supports lawful donation matching only.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-rose-50/40 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="mx-auto w-full max-w-7xl px-4 pb-6">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
          Emergency Organ Donation in {city}
        </h1>
        <p className="mt-3 max-w-3xl text-base font-medium text-gray-600">
          Real-time organ donor matching for {city}, {country}. When city supply is low, nearest country results are shown automatically.
        </p>
        <p className="mt-2 text-xs font-semibold text-gray-500">Canonical: {canonical}</p>
      </section>
      <CityLandingDonorGrid mode="organ" city={city} country={country} />
    </main>
  );
}
