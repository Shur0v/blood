import type { Metadata } from "next";
import Link from "next/link";
import { getBloodGroupCityCounts } from "@/src/backend/services/seoData";
import { BLOOD_GROUPS, bloodGroupToSlug, cityToSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blood Donor Search | Find Donors by Blood Group and City",
  description: "Search BloodNet public donor pages by blood group and city. Find urgent blood donor support through a free community-powered network.",
  alternates: { canonical: "/blood" },
};

export default async function BloodIndexPage() {
  const rows = await getBloodGroupCityCounts();
  const topCities = Array.from(new Map(rows.map((row) => [`${row.country}::${row.city}`, row])).values()).slice(0, 24);
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Programmatic blood search</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Find Blood Donors by City and Blood Group</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Browse real BloodNet donor availability from registered donors and admin-added donor records. Open a blood group or city page for SEO-friendly, crawlable emergency guidance.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-black">Blood Groups</h2>
          <div className="mt-6 grid grid-cols-2 gap-3">
            {BLOOD_GROUPS.map((group) => {
              const slug = bloodGroupToSlug(group);
              return slug ? <Link key={group} href={`/blood/${slug}`} className="rounded-[8px] bg-white p-5 text-2xl font-black text-primary shadow-card">{group}</Link> : null;
            })}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black">Active Cities</h2>
          <div className="mt-6 grid gap-3">
            {topCities.map((row) => (
              <Link key={`${row.country}-${row.city}`} href={`/blood/${cityToSlug(row.city)}`} className="rounded-[8px] bg-white p-4 font-black shadow-card">
                {row.city}, {row.country}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
