import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KEYWORD_LANDINGS, getKeywordLandingsByCountryIntent } from "@/src/lib/keywordLandings";
import ManagedNativeAdSlot from "@/src/components/ManagedNativeAdSlot";

const HUBS: Record<string, { country: string; aliases: string[]; title: string; intro: string }> = {
  usa: {
    country: "United States",
    aliases: ["usa", "us", "united states", "america", "new york", "los angeles", "houston", "boston"],
    title: "USA Blood & Community Keyword Hub",
    intro: "High-intent long-tail keyword pages for blood donor and community support searches across the United States.",
  },
  uk: {
    country: "United Kingdom",
    aliases: ["uk", "united kingdom", "london", "manchester", "birmingham"],
    title: "UK Blood & Community Keyword Hub",
    intro: "Focused long-tail pages for emergency blood and community support search behavior in the United Kingdom.",
  },
  spain: {
    country: "Spain",
    aliases: ["spain", "madrid", "barcelona"],
    title: "Spain Blood & Community Keyword Hub",
    intro: "Country-specific keyword targets for donor discovery and community routing in Spain.",
  },
  netherlands: {
    country: "Netherlands",
    aliases: ["netherlands", "amsterdam", "rotterdam", "the hague"],
    title: "Netherlands Blood & Community Keyword Hub",
    intro: "Long-tail keyword coverage for blood donor and community-led support flows in the Netherlands.",
  },
  italy: {
    country: "Italy",
    aliases: ["italy", "rome", "milan", "naples"],
    title: "Italy Blood & Community Keyword Hub",
    intro: "Optimized long-tail pages for emergency donor search patterns across Italy.",
  },
  poland: {
    country: "Poland",
    aliases: ["poland", "warsaw", "krakow"],
    title: "Poland Blood & Community Keyword Hub",
    intro: "Regional long-tail index pages for blood and community support discovery in Poland.",
  },
  australia: {
    country: "Australia",
    aliases: ["australia", "sydney", "melbourne", "brisbane", "perth"],
    title: "Australia Blood & Community Keyword Hub",
    intro: "Targeted long-tail pages to improve donor and community intent matching in Australia.",
  },
};

type Params = { country: string };

export function generateStaticParams() {
  return Object.keys(HUBS).map((country) => ({ country }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { country } = await params;
  const hub = HUBS[country.toLowerCase()];
  if (!hub) return { robots: { index: false, follow: true } };
  return {
    title: `${hub.country} Keyword Hub | Blood Donor & Community Searches`,
    description: `Country-specific SEO hub for ${hub.country} long-tail blood donor and community support pages.`,
    alternates: { canonical: `/country-keyword-hubs/${country.toLowerCase()}` },
  };
}

export default async function CountryKeywordHubPage({ params }: { params: Promise<Params> }) {
  const { country } = await params;
  const hub = HUBS[country.toLowerCase()];
  if (!hub) notFound();

  const strictCountry = getKeywordLandingsByCountryIntent(hub.country);
  const aliasMatches = KEYWORD_LANDINGS.filter((entry) =>
    hub.aliases.some((alias) => entry.keyword.toLowerCase().includes(alias.toLowerCase())),
  );

  const dedup = new Map<string, { slug: string; keyword: string }>();
  [...strictCountry, ...aliasMatches].forEach((entry) => {
    if (!dedup.has(entry.slug)) dedup.set(entry.slug, entry);
  });

  const list = Array.from(dedup.values()).slice(0, 180);

  return (
    <>
      <ManagedNativeAdSlot slotKey="native-ad-2" />
      <main className="mx-auto max-w-7xl px-4 pt-16 pb-12">
        <section className="rounded-[8px] border border-border/20 bg-white/90 p-6 shadow-card">
        <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">{hub.title}</h1>
        <p className="mt-4 max-w-4xl text-sm font-medium leading-7 text-gray-700 md:text-base">{hub.intro}</p>
        <p className="mt-3 text-sm font-semibold text-gray-600">
          These pages are curated for human-readable intent coverage and regional relevance. Use them as index hubs and internal link anchors.
        </p>

        <h2 className="mt-8 text-xl font-black text-gray-900">Best Regional Long-Tail Pages</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((entry) => (
            <Link
              key={entry.slug}
              href={`/keywords/${entry.slug}`}
              className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm"
            >
              {entry.keyword}
            </Link>
          ))}
        </div>
        </section>
      </main>
      <ManagedNativeAdSlot slotKey="native-ad-2" />
    </>
  );
}
