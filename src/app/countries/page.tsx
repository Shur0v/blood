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
  return <main className="min-h-screen bg-bg px-4 py-20 text-gray-900"><section className="mx-auto max-w-5xl"><h1 className="text-4xl font-black md:text-6xl">Active Countries</h1><div className="mt-8 grid gap-4 sm:grid-cols-3">{countries.map((country) => { const shortcut = countryToShortcut(country); return <Link key={country} href={shortcut ? `/${shortcut}` : `/countries`} className="rounded-[8px] bg-white p-5 font-black shadow-card">{country}</Link>; })}</div></section></main>;
}
