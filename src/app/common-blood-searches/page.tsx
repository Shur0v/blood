import {toLocationSlug} from '@/src/backend/utils/locationSlug';
import type { Metadata } from "next";
import Link from "next/link";
import { getBloodGroupCityCounts } from "@/src/backend/services/seoData";
import { BLOOD_GROUPS, bloodGroupToSlug, cityToSlug } from "@/src/lib/seoRouting";
import ManagedNativeAdSlot from "@/src/components/ManagedNativeAdSlot";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Explore blood donor locations | Global Donor Discovery",
  description:
    "Browse recorded blood groups and participating cities, with practical donor coordination guides.",
  alternates: { canonical: "/common-blood-searches" },
};

export default async function CommonBloodSearchesPage() {
  const rows = await getBloodGroupCityCounts();
  const topCityRows = Array.from(new Map(rows.map((row) => [`${row.country}::${row.city}`, row])).values()).slice(0, 12);

  return (
    <>
      <ManagedNativeAdSlot slotKey="native-ad-2" />
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-14">
        <section className="rounded-[8px] border border-border/20 bg-white/80 p-6 shadow-card">
          <h1 className="text-3xl font-semibold tracking-tight text-gray-900 md:text-4xl">Explore blood donor locations</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium text-gray-600 md:text-base">
            Browse recorded blood groups and cities. These links describe directory coverage, not measured search demand.
          </p>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">Browse blood groups</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {BLOOD_GROUPS.map((group) => {
              const slug = bloodGroupToSlug(group);
              if (!slug) return null;
              return (
                <Link
                  key={group}
                  href={`/blood/${slug}`}
                  className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-center text-sm font-semibold text-primary shadow-sm"
                >
                  {group}
                </Link>
              );
            })}
          </div>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">Cities represented in the directory</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topCityRows.map((row) => (
              <Link
                key={`${row.country}-${row.city}`}
                href={`/blood-donors/${toLocationSlug(row.country)}/${toLocationSlug(row.city)}`}
                className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm"
              >
                {row.city}, {row.country}
              </Link>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-semibold text-gray-900">Guides and real network coverage</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/guides" className="research-text-link">Read the guide library →</Link><Link href="/network" className="research-text-link">Explore real country coverage →</Link><Link href="/donors" className="research-text-link">Meet opt-in public volunteers →</Link>
          </div>
        </section>
      </main>
      <ManagedNativeAdSlot slotKey="native-ad-2" />

    </>
  );
}

