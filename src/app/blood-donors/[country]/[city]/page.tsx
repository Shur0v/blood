import type { Metadata } from "next";
import { getPrisma } from "@/src/backend/config/db";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import CityLandingDonorGrid from "@/src/components/CityLandingDonorGrid";
import { fromLocationSlug } from "@/src/backend/utils/locationSlug";

interface Props {
  params: Promise<{ country: string; city: string }>;
}

const getExactBloodCityCount = async (city: string, country: string): Promise<number> => {
  const prisma = getPrisma();
  const rows = await prisma.$queryRaw<Array<{ total: bigint | number }>>`
    SELECT (
      (SELECT COUNT(*) FROM "UserServiceCity" usc JOIN "User" u ON u.id = usc.user_id
        WHERE u.is_active_donor = true
          AND LOWER(usc.city) = LOWER(${city})
          AND LOWER(usc.country) = LOWER(${country}))
      +
      (SELECT COUNT(*) FROM "User" u
        WHERE u.is_active_donor = true
          AND LOWER(u.location_city) = LOWER(${city})
          AND LOWER(u.location_country) = LOWER(${country}))
      +
      (SELECT COUNT(*) FROM "ManualBloodDonor" mbd
        WHERE mbd.is_active_donor = true
          AND LOWER(mbd.location_city) = LOWER(${city})
          AND LOWER(mbd.location_country) = LOWER(${country}))
    ) AS total
  `;
  const val = rows[0]?.total ?? 0;
  return typeof val === "bigint" ? Number(val) : Number(val);
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await params;
  const city = fromLocationSlug(p.city);
  const country = fromLocationSlug(p.country);
  const exactCount = await getExactBloodCityCount(city, country);
  const baseUrl = getPublicBaseUrl();
  const canonical = `${baseUrl}/blood-donors/${p.country}/${p.city}`;
  const title = `Emergency Blood Donor in ${city} | Urgent Blood Donation in ${city} | BloodNet`;
  const description = `Find urgent blood donation in ${city}, ${country}. Real-time donor listing with nearest city and country fallback for emergency support.`;
  const keywords = [
    `emergency blood donor in ${city}`,
    `urgent blood donation in ${city}`,
    `blood donors in ${city}`,
    `blood donation in ${country}`,
    `find blood donor near ${city}`,
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

export default async function BloodCityLandingPage({ params }: Props) {
  const p = await params;
  const city = fromLocationSlug(p.city);
  const country = fromLocationSlug(p.country);
  const baseUrl = getPublicBaseUrl();
  const canonical = `${baseUrl}/blood-donors/${p.country}/${p.city}`;

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `How to find emergency blood donor in ${city}?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Use this page to see live blood donors prioritized for ${city}, then nearest country matches if local supply is low.`,
        },
      },
      {
        "@type": "Question",
        name: `Is blood donation paid on BloodNet?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: "BloodNet supports free voluntary donation only. Organ trade and paid organ transactions are strictly prohibited.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-rose-50/40 pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="mx-auto w-full max-w-7xl px-4 pb-6">
        <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
          Emergency Blood Donor in {city}
        </h1>
        <p className="mt-3 max-w-3xl text-base font-medium text-gray-600">
          Fast blood donor discovery for {city}, {country}. This page is optimized for urgent blood donation queries and always shows live, nearest-first data.
        </p>
        <p className="mt-2 text-xs font-semibold text-gray-500">Canonical: {canonical}</p>
      </section>
      <CityLandingDonorGrid mode="blood" city={city} country={country} />
    </main>
  );
}
