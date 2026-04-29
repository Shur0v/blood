import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getBloodGroupSummary, getCityBloodSummary } from "@/src/backend/services/seoData";
import { BLOOD_GROUPS, absoluteUrl, bloodGroupFromSlug, bloodGroupToSlug, cityFromSlug, jsonLdScript } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const bloodGroup = bloodGroupFromSlug(slug);
  const readable = bloodGroup || cityFromSlug(slug);
  const isGroup = Boolean(bloodGroup);
  const title = isGroup
    ? `${bloodGroup} Blood Donors by City | Find Active Donors`
    : `Blood Donors in ${readable} | Urgent Blood and Organ Donation Support`;
  const description = isGroup
    ? `Find active ${bloodGroup} blood donors across cities and countries. Browse registered donor availability by location.`
    : `Find active blood donors, available blood groups, and urgent donation support in ${readable}. Search by blood group, city, and urgent need.`;
  const baseUrl = getPublicBaseUrl();
  return {
    title,
    description,
    alternates: { canonical: `/blood/${slug}` },
    openGraph: { title, description, url: absoluteUrl(baseUrl, `/blood/${slug}`), siteName: "BloodNet", type: "website" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BloodSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const bloodGroup = bloodGroupFromSlug(slug);
  const rows = bloodGroup ? await getBloodGroupSummary(bloodGroup) : await getCityBloodSummary(slug);
  if (rows.length === 0) notFound();

  const baseUrl = getPublicBaseUrl();
  const cityName = rows[0]?.city || cityFromSlug(slug);
  const country = rows[0]?.country || "Global";
  const total = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
  const lastUpdated = rows.reduce<Date | null>((latest, row) => {
    if (!row.updated_at) return latest;
    return !latest || row.updated_at > latest ? row.updated_at : latest;
  }, null) || new Date();
  const faq = bloodGroup
    ? [
        [`Where can I find ${bloodGroup} blood donors?`, `This page lists cities where BloodNet has registered or admin-added ${bloodGroup} donor availability.`],
        ["Is BloodNet free?", "Yes. BloodNet is a free donor connection platform for voluntary blood donation support."],
      ]
    : [
        [`How can I find blood donors in ${cityName}?`, `Use the blood group links on this page to open city-specific donor pages for ${cityName}.`],
        ["What if my needed blood group is not listed?", "Contact hospitals first and check nearby cities. Low-data pages should not be treated as confirmed blood bank inventory."],
      ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: bloodGroup ? `${bloodGroup} blood donors by city` : `Blood donors in ${cityName}`,
      url: absoluteUrl(baseUrl, `/blood/${slug}`),
      dateModified: lastUpdated.toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map(([question, answer]) => ({
        "@type": "Question",
        name: question,
        acceptedAnswer: { "@type": "Answer", text: answer },
      })),
    },
  ];

  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Blood donor search</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">
          {bloodGroup ? `${bloodGroup} Blood Donors by City` : `Blood Donors in ${cityName}`}
        </h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          {bloodGroup
            ? `Browse active ${bloodGroup} donor availability across real BloodNet cities. Open a city page to see donor cards, safety guidance, and related blood groups.`
            : `Find active blood donors and available blood groups in ${cityName}, ${country}. Choose a blood group to open the urgent donor page for that location.`}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Public donor entries</p><p className="text-3xl font-black text-primary">{total}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">{bloodGroup ? "Active cities" : "Available groups"}</p><p className="text-3xl font-black">{rows.length}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Last updated</p><p className="text-xl font-black">{lastUpdated.toLocaleDateString()}</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-black">{bloodGroup ? "Cities with Donor Availability" : `Blood Groups Available in ${cityName}`}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {rows.map((row) => {
            const groupSlug = bloodGroupToSlug(row.blood_group);
            if (!groupSlug) return null;
            const citySlug = row.city.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");
            return (
              <Link key={`${row.blood_group}-${row.city}-${row.country}`} href={`/blood/${groupSlug}/${citySlug}`} className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-card transition hover:border-primary/40">
                <p className="text-2xl font-black text-primary">{row.blood_group}</p>
                <h3 className="mt-2 font-black">{row.city}, {row.country}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-500">{Number(row.total).toLocaleString()} donor entries</p>
              </Link>
            );
          })}
        </div>
      </section>

      {!bloodGroup && (
        <section className="mx-auto max-w-6xl px-4 pb-16">
          <h2 className="text-3xl font-black">All Blood Group Pages for {cityName}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {BLOOD_GROUPS.map((group) => {
              const groupSlug = bloodGroupToSlug(group);
              return groupSlug ? <Link key={group} href={`/blood/${groupSlug}/${slug}`} className="rounded-[8px] bg-white px-4 py-2 text-sm font-black shadow-sm">{group} in {cityName}</Link> : null;
            })}
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl font-black">Frequently Asked Questions</h2>
        <div className="mt-6 grid gap-4">
          {faq.map(([question, answer]) => (
            <article key={question} className="rounded-[8px] bg-white p-5 shadow-card">
              <h3 className="font-black">{question}</h3>
              <p className="mt-2 text-sm font-semibold leading-7 text-gray-600">{answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
