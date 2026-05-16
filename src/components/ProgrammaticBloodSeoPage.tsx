import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getBloodDonorsByGroupAndCity,
  getBloodGroupSummary,
  getCityBloodSummary,
  getNetworkStats,
  getRelatedBloodGroups,
  type CityBloodCount,
} from "@/src/backend/services/seoData";
import {
  BLOOD_GROUPS,
  bloodGroupReadable,
  bloodGroupToSlug,
  cityToSlug,
  maskPublicPhone,
  type BloodGroup,
} from "@/src/lib/seoRouting";
import ManagedNativeAdSlot from "@/src/components/ManagedNativeAdSlot";

const formatDate = (date: Date | null | undefined) =>
  date
    ? new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date)
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
      <p className="text-xs font-black uppercase tracking-[0.18em] text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-black text-primary">{value}</p>
    </div>
  );
}

function SafetyNotice() {
  return (
    <section className="rounded-[8px] border border-red-100 bg-white p-6 shadow-card">
      <h2 className="text-2xl font-black">Emergency and Safety Guidance</h2>
      <p className="mt-3 font-semibold leading-8 text-gray-600">
        BloodNet is a free donor connection platform. For urgent medical situations, contact a hospital,
        licensed blood bank, ambulance service, or local emergency authority first. Donor availability can
        change, so families should verify identity, eligibility, and donation timing through qualified
        medical staff before any donation.
      </p>
    </section>
  );
}

function FaqBlock({ group, city }: { group?: BloodGroup; city?: string }) {
  const readableGroup = group ? bloodGroupReadable(group) : "blood";
  const location = city || "your city";
  const faqs = [
    {
      q: `How can I find ${readableGroup} donors in ${location}?`,
      a: `Use this page to review public donor availability, city coverage, and related BloodNet links for ${readableGroup} donor support in ${location}.`,
    },
    {
      q: "Is BloodNet free for patients and families?",
      a: "Yes. BloodNet is built as a free connection platform for blood donors, patients, families, and community supporters.",
    },
    {
      q: "Does this page replace hospital blood bank confirmation?",
      a: "No. Always confirm urgent blood requirements with hospitals, licensed blood banks, and qualified medical professionals.",
    },
  ];

  return (
    <section className="rounded-[8px] bg-white p-6 shadow-card">
      <h2 className="text-2xl font-black">Frequently Asked Questions</h2>
      <div className="mt-5 grid gap-4">
        {faqs.map((item) => (
          <article key={item.q} className="border-t border-gray-100 pt-4">
            <h3 className="font-black">{item.q}</h3>
            <p className="mt-2 font-semibold leading-7 text-gray-600">{item.a}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

export async function BloodGroupCitySeoPage({ bloodGroup, citySlug }: { bloodGroup: BloodGroup; citySlug: string }) {
  const [donors, cityRows, groupRows, network] = await Promise.all([
    getBloodDonorsByGroupAndCity(bloodGroup, citySlug),
    getCityBloodSummary(citySlug),
    getBloodGroupSummary(bloodGroup),
    getNetworkStats(undefined, citySlug),
  ]);

  if (!donors.length || !cityRows.length) notFound();

  const city = donors[0]?.location_city || cityRows[0].city;
  const country = donors[0]?.location_country || cityRows[0].country;
  const groupCount = donors.length;
  const cityTotal = cityRows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const lastUpdated =
    donors.reduce<Date | null>((latest, row) => (!latest || row.updated_at > latest ? row.updated_at : latest), null) ||
    network.lastUpdated;
  const relatedGroups = getRelatedBloodGroups(bloodGroup)
    .map((group) => ({ group, slug: bloodGroupToSlug(group) }))
    .filter((item) => item.slug);
  const relatedCities = uniqueCities(groupRows)
    .filter((row) => cityToSlug(row.city) !== citySlug)
    .slice(0, 8);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: `Urgent ${bloodGroup} Blood Donors in ${city}`,
      description: `Find active ${bloodGroup} blood donors in ${city}, ${country}.`,
      dateModified: lastUpdated?.toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "Dataset",
      name: `${bloodGroup} blood donor availability in ${city}`,
      description: `Public BloodNet page showing ${groupCount} recent ${bloodGroup} donor entries and ${formatCount(cityTotal)} total city donor entries in ${city}.`,
      keywords: [`urgent ${bloodGroup} blood ${city}`, `${bloodGroup} donor ${city}`, `emergency blood donor ${city}`],
      dateModified: lastUpdated?.toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: `How can I find ${bloodGroup} blood donors in ${city}?`,
          acceptedAnswer: { "@type": "Answer", text: `Use this page to view public ${bloodGroup} donor availability in ${city} and follow BloodNet contact rules.` },
        },
        {
          "@type": "Question",
          name: "Is BloodNet free?",
          acceptedAnswer: { "@type": "Answer", text: "Yes. BloodNet is a free donor connection platform." },
        },
      ],
    },
  ];

  return (
    <PageShell jsonLd={jsonLd}>
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{country} blood donor network</p>
        <h1 className="mt-4 text-4xl font-black tracking-normal md:text-6xl">Urgent {bloodGroup} Blood Donors in {city}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Find active and registered {bloodGroup} blood donors in {city}, {country}. This page is built for
          families searching for urgent {bloodGroup} blood in {city}, emergency blood donor support, and
          privacy-safe donor contact options.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          <StatCard label={`${bloodGroup} donor entries`} value={formatCount(groupCount)} />
          <StatCard label={`All donors in ${city}`} value={formatCount(cityTotal)} />
          <StatCard label="Blood groups in city" value={network.bloodGroups.length} />
          <StatCard label="Last updated" value={formatDate(lastUpdated)} />
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[8px] bg-white p-6 shadow-card">
          <h2 className="text-2xl font-black">Available {bloodGroup} Donors in {city}</h2>
          <div className="mt-5 grid gap-3">
            {donors.slice(0, 12).map((donor) => (
              <article key={`${donor.source_type}-${donor.id}`} className="rounded-[8px] border border-gray-100 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black">{donor.name || "BloodNet donor"}</h3>
                    <p className="mt-1 text-sm font-semibold text-gray-500">{donor.location_city}, {donor.location_country}</p>
                  </div>
                  <span className="rounded-full bg-red-50 px-3 py-1 text-sm font-black text-primary">{donor.blood_group}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-600">
                  Contact: {maskPublicPhone(donor.mobile)} - BloodNet registered donor entry
                </p>
              </article>
            ))}
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[8px] bg-white p-6 shadow-card">
            <h2 className="text-xl font-black">Related Blood Groups in {city}</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {relatedGroups.map((item) => (
                <Link key={item.group} href={`/blood/${item.slug}/${citySlug}`} className="rounded-full bg-red-50 px-3 py-2 text-sm font-black text-primary">
                  {item.group} donors
                </Link>
              ))}
            </div>
          </div>

          <div className="rounded-[8px] bg-white p-6 shadow-card">
            <h2 className="text-xl font-black">Other Cities with {bloodGroup}</h2>
            <div className="mt-4 grid gap-2">
              {relatedCities.map((row) => {
                const groupSlug = bloodGroupToSlug(bloodGroup);
                return (
                  <Link key={`${row.country}-${row.city}`} href={`/blood/${groupSlug}/${cityToSlug(row.city)}`} className="font-bold text-gray-700 hover:text-primary">
                    {bloodGroup} blood donors in {row.city}, {row.country}
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 lg:grid-cols-2">
        <SafetyNotice />
        <FaqBlock group={bloodGroup} city={city} />
      </section>
    </PageShell>
  );
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
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Blood group donor directory</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">{bloodGroup} Blood Donors by City</h1>
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
        <h2 className="text-2xl font-black">Cities with {bloodGroup} Blood Donors</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((row) => (
            <Link key={`${row.country}-${row.city}-${row.blood_group}`} href={`/blood/${bloodGroupToSlug(row.blood_group)}/${cityToSlug(row.city)}`} className="rounded-[8px] bg-white p-5 shadow-card">
              <p className="text-sm font-black uppercase tracking-[0.16em] text-primary">{row.country}</p>
              <h3 className="mt-2 text-xl font-black">{row.city}</h3>
              <p className="mt-2 font-semibold text-gray-600">{formatCount(row.total)} {bloodGroup} donor entries</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

export async function CityBloodSeoPage({ citySlug }: { citySlug: string }) {
  const rows = await getCityBloodSummary(citySlug);
  if (!rows.length) notFound();

  const city = rows[0].city;
  const country = rows[0].country;
  const total = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const available = new Set(rows.map((row) => row.blood_group));
  const lastUpdated = rows.reduce<Date | null>((latest, row) => {
    if (!row.updated_at) return latest;
    return !latest || row.updated_at > latest ? row.updated_at : latest;
  }, null);

  return (
    <PageShell
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "MedicalWebPage",
        name: `Blood donors in ${city}`,
        description: `Find active blood donor entries and available blood groups in ${city}, ${country}.`,
        dateModified: lastUpdated?.toISOString(),
      }}
    >
      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">{country} city donor directory</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Blood Donors in {city}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Search active blood donors in {city} by blood group. This city page shows real donor availability,
          available blood groups, emergency guidance, and direct links to urgent blood donor pages.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <StatCard label={`Total donors in ${city}`} value={formatCount(total)} />
          <StatCard label="Available blood groups" value={available.size} />
          <StatCard label="Last updated" value={formatDate(lastUpdated)} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20">
        <h2 className="text-2xl font-black">Available Blood Groups in {city}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BLOOD_GROUPS.map((group) => {
            const row = rows.find((item) => item.blood_group === group);
            const href = `/blood/${bloodGroupToSlug(group)}/${citySlug}`;
            return row ? (
              <Link key={group} href={href} className="rounded-[8px] bg-white p-5 shadow-card">
                <p className="text-3xl font-black text-primary">{group}</p>
                <h3 className="mt-2 font-black">{group} donors in {city}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-500">{formatCount(row.total)} donor entries</p>
              </Link>
            ) : (
              <div key={group} className="rounded-[8px] border border-dashed border-gray-200 bg-white/60 p-5">
                <p className="text-3xl font-black text-gray-300">{group}</p>
                <h3 className="mt-2 font-black text-gray-500">No public entries yet</h3>
                <p className="mt-1 text-sm font-semibold text-gray-400">This group is not indexable until data exists.</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-20 lg:grid-cols-2">
        <SafetyNotice />
        <FaqBlock city={city} />
      </section>
    </PageShell>
  );
}
