import type { Metadata } from "next";
import Link from "next/link";
import { getNetworkStats } from "@/src/backend/services/seoData";
import { countryToShortcut } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Active BloodNet Countries", description: "Browse active BloodNet country donor network pages.", alternates: { canonical: "/countries" } };

export default async function CountriesPage() {
  const stats = await getNetworkStats();
  const countries = Array.from(new Set(stats.rows.map((row) => row.country))).sort();
  const hubLinks = [
    { slug: "usa", label: "USA Keyword Hub" },
    { slug: "uk", label: "UK Keyword Hub" },
    { slug: "spain", label: "Spain Keyword Hub" },
    { slug: "netherlands", label: "Netherlands Keyword Hub" },
    { slug: "italy", label: "Italy Keyword Hub" },
    { slug: "poland", label: "Poland Keyword Hub" },
    { slug: "australia", label: "Australia Keyword Hub" },
  ];

  return (
    <main className="min-h-screen bg-bg px-4 py-20 text-gray-900">
      <section className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-black md:text-6xl">Active Countries</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {countries.map((country) => {
            const shortcut = countryToShortcut(country);
            return (
              <Link key={country} href={shortcut ? `/${shortcut}` : `/countries`} className="rounded-[8px] bg-white p-5 font-black shadow-card">
                {country}
              </Link>
            );
          })}
        </div>

        <h2 className="mt-12 text-2xl font-black">Country SEO Keyword Hubs</h2>
        <p className="mt-3 text-sm font-medium text-gray-600">
          Use these curated hub pages to navigate country-specific long-tail queries with stronger regional relevance.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {hubLinks.map((hub) => (
            <Link
              key={hub.slug}
              href={`/country-keyword-hubs/${hub.slug}`}
              className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm"
            >
              {hub.label}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
