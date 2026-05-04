import Link from "next/link";
import { notFound } from "next/navigation";
import { getNetworkStats, getVerifiedOrganRequests } from "@/src/backend/services/seoData";
import { bloodGroupToSlug, cityToSlug } from "@/src/lib/seoRouting";
import SiteNavShell from "@/src/components/SiteNavShell";

interface SeoLocationLandingProps {
  country?: string;
  citySlug?: string;
  title: string;
  intro: string;
}

export default async function SeoLocationLanding({ country, citySlug, title, intro }: SeoLocationLandingProps) {
  const [stats, requests] = await Promise.all([getNetworkStats(country, citySlug), getVerifiedOrganRequests()]);
  if (stats.totalDonors === 0) notFound();
  const filteredRequests = requests.filter((row) => {
    if (country && row.location_country.toLowerCase() !== country.toLowerCase()) return false;
    if (citySlug && cityToSlug(row.location_city) !== citySlug) return false;
    return true;
  });

  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Global donor support network</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">{intro}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Donor entries</p><p className="text-3xl font-black text-primary">{stats.totalDonors}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Active cities</p><p className="text-3xl font-black">{stats.cities}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Blood groups</p><p className="text-3xl font-black">{stats.bloodGroups.length}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Verified requests</p><p className="text-3xl font-black">{filteredRequests.length}</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-black">Available Blood Group Pages</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.rows.slice(0, 32).map((row) => {
            const groupSlug = bloodGroupToSlug(row.blood_group);
            const locationSlug = cityToSlug(row.city);
            return groupSlug ? (
              <Link key={`${row.country}-${row.city}-${row.blood_group}`} href={`/blood/${groupSlug}/${locationSlug}`} className="rounded-[8px] bg-white p-5 shadow-card">
                <p className="text-2xl font-black text-primary">{row.blood_group}</p>
                <h3 className="mt-2 font-black">{row.city}, {row.country}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-500">{Number(row.total).toLocaleString()} donor entries</p>
              </Link>
            ) : null;
          })}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl font-black">Safety Guidance</h2>
        <p className="mt-4 max-w-3xl font-semibold leading-8 text-gray-600">
          BloodNet is a free connection service. It does not confirm blood bank inventory or replace hospitals, emergency services, licensed medical professionals, or legal transplant authorities.
        </p>
      </section>

      <SiteNavShell />
    </main>
  );
}
