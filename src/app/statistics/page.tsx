import type { Metadata } from "next";
import { getPublicBotStats } from "@/src/backend/services/seoData";
import {getPublicBaseUrl} from '@/src/backend/config/env';
import {stringifyJsonLd} from '@/src/lib/aiSeo';

export const revalidate = 1800;
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "BloodNet Public Statistics", description: "Public BloodNet donor network statistics, active cities, countries, blood groups, and verified organ requests.", alternates: { canonical: "/statistics" } };

export default async function StatisticsPage() {
  const stats = await getPublicBotStats();
  const metrics=[['Active directory listings',stats.totalListingCount],['Registered accounts (all)',stats.totalRegisteredAccounts],['Active registered donor accounts',stats.activeRegisteredAccounts],['Manual donor entries',stats.manualDonorEntries],['Community listings',stats.communityListings],['Countries with coverage',stats.activeCountries],['Recorded city locations',stats.activeCities],['Verified organ requests',stats.verifiedOrganRequests]] as const;
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={{__html:stringifyJsonLd({'@context':'https://schema.org','@type':'Dataset',name:'BloodNet public directory statistics',url:getPublicBaseUrl()+'/statistics',description:stats.publicCountingPolicy,dateModified:stats.lastUpdated||undefined,creator:{'@type':'Organization',name:'BloodNet',url:getPublicBaseUrl()},variableMeasured:metrics.map(([name,value])=>({'@type':'PropertyValue',name,value}))})}}/>
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Data transparency</p>
        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">BloodNet Public Statistics</h1>
        <p className="mt-6 max-w-3xl text-base leading-8">BloodNet currently lists <strong>{stats.totalListingCount.toLocaleString()} active directory entries</strong>: {stats.activeRegisteredAccounts.toLocaleString()} active registered accounts, {stats.manualDonorEntries.toLocaleString()} manual donor entries and {stats.communityListings.toLocaleString()} community listings. These categories are different; the directory total is not a count of registered accounts or completed donations.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-4">{metrics.map(([label,value])=><div key={label} className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">{label}</p><p className="text-3xl font-semibold text-primary">{value.toLocaleString()}</p></div>)}</div>
        <h2 className="mt-10 text-2xl font-semibold">How these figures are counted</h2><dl className="mt-5 space-y-5">{Object.entries(stats.countDefinitions).map(([term,definition])=><div key={term}><dt className="font-semibold">{term.replace(/([a-z])([A-Z])/g,'$1 $2')}</dt><dd className="mt-1 max-w-3xl leading-7 text-slate-600">{definition}</dd></div>)}</dl><p className="mt-8 max-w-3xl text-sm leading-7 text-slate-600">{stats.publicCountingPolicy}</p><p className="mt-4 text-sm text-slate-600">Snapshot generated: <time dateTime={stats.generatedAt}>{stats.generatedAt}</time>. Directory records last changed: {stats.lastUpdated||'Not recorded'}.</p><a className="mt-4 inline-block text-rose-700 underline" href="/site-state.json">Machine-readable current statistics</a>
      </section>
    </main>
  );
}
