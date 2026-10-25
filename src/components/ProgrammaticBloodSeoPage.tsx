import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBloodDonorsByGroupAndCity,
  getBloodGroupSummary,
  getCityBloodSummary,
  type CityBloodCount,
} from "@/src/backend/services/seoData";
import {
  bloodGroupToSlug,
  cityToSlug,
  type BloodGroup,
} from "@/src/lib/seoRouting";
import ManagedNativeAdSlot from "@/src/components/ManagedNativeAdSlot";
import RegionalCityExperience from './regional/RegionalCityExperience';
import {RegionalAuthActions} from './regional/RegionalInteractions';

const formatDate = (date: Date | null | undefined) =>
  date
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" }).format(date)
    : "Recently updated";

const formatCount = (value: bigint | number | string | null | undefined) => Number(value ?? 0).toLocaleString();

const uniqueCities = (rows: CityBloodCount[]) => {
  const seen = new Set<string>();
  return rows.filter((row) => {
    const key = `${row.country}:${row.city}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const pageJsonLd = (data: unknown) => ({
  __html: JSON.stringify(data).replace(/</g, "\\u003c"),
});

function PageShell({ children, jsonLd }: { children: React.ReactNode; jsonLd: unknown }) {
  return (
    <main className="min-h-screen bg-bg text-gray-950">
      <script type="application/ld+json" dangerouslySetInnerHTML={pageJsonLd(jsonLd)} />
      <ManagedNativeAdSlot slotKey="native-ad-2" />
      {children}
      <ManagedNativeAdSlot slotKey="native-ad-2" />
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[8px] border border-red-100 bg-white p-5 shadow-card">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-primary">{value}</p>
    </div>
  );
}

export async function BloodGroupCitySeoPage({ bloodGroup, citySlug }: { bloodGroup: BloodGroup; citySlug: string }) {
  const [donors, cityRows] = await Promise.all([
    getBloodDonorsByGroupAndCity(bloodGroup, citySlug),
    getCityBloodSummary(citySlug),
  ]);

  if (!donors.length || !cityRows.length) notFound();

  const city = donors[0]?.location_city || cityRows[0].city;
  const country = donors[0]?.location_country || cityRows[0].country;
  const localRows = cityRows.filter(row => row.country === country);
  const groupCount = localRows.filter(row => row.blood_group === bloodGroup).reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const cityTotal = localRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const lastUpdated =
    localRows.reduce<Date | null>((latest, row) => (row.updated_at && (!latest || row.updated_at > latest) ? row.updated_at : latest), null);
  const introduction = (
      <section data-region-section="1" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{country} blood donor network</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal md:text-6xl">Urgent {bloodGroup} Blood Donors in {city}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Find active and registered {bloodGroup} blood donors in {city}, {country}. This page is built for
          families searching for urgent {bloodGroup} blood in {city}, emergency blood donor support, and
          privacy-safe donor contact options.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <StatCard label={`${bloodGroup} donor entries`} value={formatCount(groupCount)} />
          <StatCard label={`All donors in ${city}`} value={formatCount(cityTotal)} />
          <StatCard label="Blood groups in city" value={new Set(localRows.map(row=>row.blood_group)).size} />
          <StatCard label="Last updated" value={formatDate(lastUpdated)} />
        </div>
        <div className="mt-6"><RegionalAuthActions appearance="original"/></div>
      </section>
  );
  return <RegionalCityExperience country={country} city={city} group={bloodGroup} canonicalPath={`/blood/${bloodGroupToSlug(bloodGroup)}/${citySlug}`} title={`Urgent ${bloodGroup} Blood Donors in ${city}`} introduction={introduction} nativeAds={country.toLowerCase()!=='nepal'}/>;

}

export async function BloodGroupSeoPage({ bloodGroup }: { bloodGroup: BloodGroup }) {
  const rows = await getBloodGroupSummary(bloodGroup);
  if (!rows.length) notFound();

  const cities = uniqueCities(rows);
  const total = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const lastUpdated = rows.reduce<Date | null>((latest, row) => {
    if (!row.updated_at) return latest;
    return !latest || row.updated_at > latest ? row.updated_at : latest;
  }, null);

  return (
    <PageShell
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Dataset",
        name: `${bloodGroup} blood donor cities`,
        description: `BloodNet has ${formatCount(total)} ${bloodGroup} donor entries across ${cities.length} cities.`,
        dateModified: lastUpdated?.toISOString(),
      }}
    >
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">Blood group donor directory</p>
        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">{bloodGroup} Blood Donors by City</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Browse cities where BloodNet has active {bloodGroup} donor entries. Each city page includes donor counts,
          country context, emergency guidance, related blood groups, and privacy-safe contact information.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label={`${bloodGroup} donor entries`} value={formatCount(total)} />
          <StatCard label="Active cities" value={cities.length} />
          <StatCard label="Last updated" value={formatDate(lastUpdated)} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl font-semibold">Cities with {bloodGroup} Blood Donors</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Link key={`${row.country}-${row.city}-${row.blood_group}`} href={`/blood/${bloodGroupToSlug(row.blood_group)}/${cityToSlug(row.city)}`} className="rounded-[8px] bg-white p-5 shadow-card">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">{row.country}</p>
              <h3 className="mt-2 text-xl font-semibold">{row.city}</h3>
              <p className="mt-2 font-semibold text-gray-600">{formatCount(row.total)} {bloodGroup} donor entries</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export async function CityBloodSeoPage({ citySlug, canonicalPath }: { citySlug: string; canonicalPath?:string }) {
  const rows = await getCityBloodSummary(citySlug);
  if (!rows.length) notFound();

  const city = rows[0].city;
  const country = rows[0].country;
  const localRows = rows.filter(row=>row.country===country);
  const total = localRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const available = new Set(localRows.map((row) => row.blood_group));
  const lastUpdated = localRows.reduce<Date | null>((latest, row) => {
    if (!row.updated_at) return latest;
    return !latest || row.updated_at > latest ? row.updated_at : latest;
  }, null);

  const introduction = (
      <section data-region-section="1" className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary">{country} city donor directory</p>
        <h1 className="mt-4 text-4xl font-semibold md:text-6xl">Blood Donors in {city}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Search active blood donors in {city} by blood group. This city page shows real donor availability,
          available blood groups, emergency guidance, and direct links to urgent blood donor pages.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label={`Total donors in ${city}`} value={formatCount(total)} />
          <StatCard label="Available blood groups" value={available.size} />
          <StatCard label="Last updated" value={formatDate(lastUpdated)} />
        </div>
        <div className="mt-6"><RegionalAuthActions appearance="original"/></div>
      </section>
  );
  return <RegionalCityExperience country={country} city={city} canonicalPath={canonicalPath||`/city/${citySlug}`} title={`Blood Donors in ${city}`} introduction={introduction} nativeAds={country.toLowerCase()!=='nepal'}/>;

}
