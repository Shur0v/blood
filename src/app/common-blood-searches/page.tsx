import type { Metadata } from "next";
import Link from "next/link";
import { HomeExperience } from "@/src/app/page";
import { getBloodGroupCityCounts } from "@/src/backend/services/seoData";
import { BLOOD_GROUPS, bloodGroupToSlug, cityToSlug } from "@/src/lib/seoRouting";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Most Common Blood Searches | Global Donor Discovery",
  description:
    "Browse the most common blood donor searches by blood group and high-demand cities, then continue with the full BloodNet landing experience.",
  alternates: { canonical: "/common-blood-searches" },
};

export default async function CommonBloodSearchesPage() {
  const rows = await getBloodGroupCityCounts();
  const topCityRows = Array.from(new Map(rows.map((row) => [`${row.country}::${row.city}`, row])).values()).slice(0, 12);

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-14">
        <section className="rounded-[8px] border border-border/20 bg-white/80 p-6 shadow-card">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">Most Common Blood Searches</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium text-gray-600 md:text-base">
            Quick access to the highest-demand blood group and city searches. Open any target page, then continue with the full landing view below.
          </p>

          <h2 className="mt-8 text-xl font-black text-gray-900">Top Blood Group Searches</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
            {BLOOD_GROUPS.map((group) => {
              const slug = bloodGroupToSlug(group);
              if (!slug) return null;
              return (
                <Link
                  key={group}
                  href={`/blood/${slug}`}
                  className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-center text-sm font-black text-primary shadow-sm"
                >
                  {group}
                </Link>
              );
            })}
          </div>

          <h2 className="mt-8 text-xl font-black text-gray-900">Top City Searches</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topCityRows.map((row) => (
              <Link
                key={`${row.country}-${row.city}`}
                href={`/blood/${cityToSlug(row.city)}`}
                className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm"
              >
                {row.city}, {row.country}
              </Link>
            ))}
          </div>
        </section>
      </main>

      <HomeExperience />
    </>
  );
}
