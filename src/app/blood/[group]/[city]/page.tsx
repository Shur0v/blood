import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { getBloodDonorsByGroupAndCity, getCityBloodSummary, getRelatedBloodGroups } from "@/src/backend/services/seoData";
import { absoluteUrl, bloodGroupFromSlug, bloodGroupToSlug, cityFromSlug, cityToSlug, jsonLdScript, maskPublicPhone } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

type Params = { group: string; city: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { group, city } = await params;
  const bloodGroup = bloodGroupFromSlug(group);
  if (!bloodGroup) return { title: "Blood donors", robots: { index: false, follow: true } };
  const cityName = cityFromSlug(city);
  const baseUrl = getPublicBaseUrl();
  const title = `Urgent ${bloodGroup} Blood Donors in ${cityName} | Find Active Donors`;
  const description = `Find registered ${bloodGroup} blood donors in ${cityName}. Search active blood donors by city and blood group for urgent emergency support.`;
  return {
    title,
    description,
    keywords: [
      `urgent ${bloodGroup} blood ${cityName}`,
      `${bloodGroup} donor ${cityName}`,
      `emergency blood donor ${cityName}`,
      "blood donor near me",
      "find blood donor fast",
      "blood needed urgently",
    ],
    alternates: { canonical: `/blood/${group}/${city}` },
    openGraph: { title, description, url: absoluteUrl(baseUrl, `/blood/${group}/${city}`), type: "website", siteName: "BloodNet" },
    twitter: { card: "summary_large_image", title, description },
  };
}

export default async function BloodGroupCityPage({ params }: { params: Promise<Params> }) {
  const { group, city } = await params;
  const bloodGroup = bloodGroupFromSlug(group);
  if (!bloodGroup) notFound();

  const [donors, citySummary] = await Promise.all([
    getBloodDonorsByGroupAndCity(bloodGroup, city),
    getCityBloodSummary(city),
  ]);

  if (donors.length === 0 && citySummary.length === 0) notFound();

  const cityName = donors[0]?.location_city || cityFromSlug(city);
  const country = donors[0]?.location_country || citySummary[0]?.country || "Global";
  const lastUpdated = donors[0]?.updated_at || citySummary[0]?.updated_at || new Date();
  const relatedGroups = getRelatedBloodGroups(bloodGroup)
    .map((item) => ({ group: item, slug: bloodGroupToSlug(item) }))
    .filter((item): item is { group: typeof item.group; slug: string } => Boolean(item.slug));
  const relatedCities = citySummary
    .filter((row) => row.blood_group !== bloodGroup)
    .slice(0, 6);
  const baseUrl = getPublicBaseUrl();
  const pageUrl = absoluteUrl(baseUrl, `/blood/${group}/${city}`);
  const faq = [
    {
      question: `How can I find a ${bloodGroup} blood donor in ${cityName}?`,
      answer: `Use this page to view registered ${bloodGroup} blood donors in ${cityName} and contact available donors according to BloodNet safety rules.`,
    },
    {
      question: "Is this blood donor service free?",
      answer: "Yes. BloodNet is a free donor connection platform for voluntary blood donation support.",
    },
    {
      question: "What should I do in a medical emergency?",
      answer: "Contact a hospital, licensed medical professional, or local emergency service first. BloodNet helps with donor discovery and does not replace medical care.",
    },
  ];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "MedicalWebPage",
      name: `Urgent ${bloodGroup} Blood Donors in ${cityName}`,
      url: pageUrl,
      description: `Public page showing registered ${bloodGroup} blood donor availability in ${cityName}, ${country}.`,
      dateModified: lastUpdated.toISOString(),
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${bloodGroup} blood donors in ${cityName}`,
      numberOfItems: donors.length,
      itemListElement: donors.slice(0, 12).map((donor, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: { "@type": "Person", name: donor.name, address: `${donor.location_city}, ${donor.location_country}` },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: "Blood", item: absoluteUrl(baseUrl, "/blood") },
        { "@type": "ListItem", position: 3, name: `${bloodGroup} in ${cityName}`, item: pageUrl },
      ],
    },
  ];

  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript(jsonLd)} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Free donor connection platform</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Urgent {bloodGroup} Blood Donors in {cityName}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Find active and registered {bloodGroup} blood donors in {cityName}, {country}. This page helps patients and families connect with available donors during urgent blood emergencies.
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Available donors</p><p className="text-3xl font-black text-primary">{donors.length}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Location</p><p className="text-xl font-black">{cityName}, {country}</p></div>
          <div className="rounded-[8px] bg-white p-5 shadow-card"><p className="text-sm font-bold text-gray-500">Last updated</p><p className="text-xl font-black">{lastUpdated.toLocaleDateString()}</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-black">Available {bloodGroup} Donors in {cityName}</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {donors.map((donor) => (
            <article key={`${donor.source_type}-${donor.id}`} className="rounded-[8px] border border-gray-200 bg-white p-5 shadow-card">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-primary text-lg font-black text-white">{donor.blood_group}</div>
                <div>
                  <h3 className="font-black">{donor.name}</h3>
                  <p className="text-sm font-semibold text-gray-500">{donor.location_city}, {donor.location_country}</p>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-600">Contact: {maskPublicPhone(donor.mobile)}</p>
              <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-400">{donor.source_type === "REGISTERED" ? "Registered donor" : "Admin-added donor"}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-black">How This Blood Donor Search Works</h2>
        <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-gray-600">
          BloodNet ranks real donor records by blood group and city, including registered donors and admin-added verified donor records. Always confirm availability through safe contact, and coordinate donation at a hospital or licensed medical location.
        </p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-16 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-black">Related Blood Groups in {cityName}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedGroups.map((item) => (
              <Link key={item.slug} href={`/blood/${item.slug}/${city}`} className="rounded-[8px] border border-red-100 bg-white px-4 py-2 text-sm font-black text-primary shadow-sm">
                {item.group} blood donors in {cityName}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-black">More Blood Support in {cityName}</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/blood/${city}`} className="rounded-[8px] border border-gray-200 bg-white px-4 py-2 text-sm font-black shadow-sm">All blood groups in {cityName}</Link>
            {relatedCities.map((row) => {
              const slug = bloodGroupToSlug(row.blood_group);
              return slug ? <Link key={row.blood_group} href={`/blood/${slug}/${city}`} className="rounded-[8px] border border-gray-200 bg-white px-4 py-2 text-sm font-black shadow-sm">{row.blood_group} in {cityName}</Link> : null;
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl font-black">Frequently Asked Questions</h2>
        <div className="mt-6 grid gap-4">
          {faq.map((item) => (
            <article key={item.question} className="rounded-[8px] bg-white p-5 shadow-card">
              <h3 className="font-black">{item.question}</h3>
              <p className="mt-2 text-sm font-semibold leading-7 text-gray-600">{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
