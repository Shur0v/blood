import type { Metadata } from "next";
import Link from "next/link";
import { getNetworkStats } from "@/src/backend/services/seoData";
import { cityToSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Active BloodNet Cities", description: "Browse active BloodNet city donor network pages.", alternates: { canonical: "/cities" } };

export default async function CitiesPage() {
  const stats = await getNetworkStats();
  const cities = Array.from(new Map(stats.rows.map((row) => [`${row.country}::${row.city}`, row])).values());
  return <main className="min-h-screen bg-bg px-4 py-20 text-gray-900"><section className="mx-auto max-w-5xl"><h1 className="text-4xl font-black md:text-6xl">Active Cities</h1><div className="mt-8 grid gap-4 sm:grid-cols-3">{cities.map((row) => <Link key={`${row.country}-${row.city}`} href={`/city/${cityToSlug(row.city)}`} className="rounded-[8px] bg-white p-5 font-black shadow-card">{row.city}, {row.country}</Link>)}</div></section></main>;
}
