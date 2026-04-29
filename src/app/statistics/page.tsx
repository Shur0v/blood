import type { Metadata } from "next";
import { getNetworkStats, getVerifiedOrganRequests } from "@/src/backend/services/seoData";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "BloodNet Public Statistics", description: "Public BloodNet donor network statistics, active cities, countries, blood groups, and verified organ requests.", alternates: { canonical: "/statistics" } };

export default async function StatisticsPage() {
  const [stats, requests] = await Promise.all([getNetworkStats(), getVerifiedOrganRequests()]);
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Data transparency</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">BloodNet Public Statistics</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Donor entries</p><p className="text-3xl font-black text-primary">{stats.totalDonors}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Countries</p><p className="text-3xl font-black">{stats.countries}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Cities</p><p className="text-3xl font-black">{stats.cities}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Verified organ requests</p><p className="text-3xl font-black">{requests.length}</p></div>
        </div>
      </section>
    </main>
  );
}
