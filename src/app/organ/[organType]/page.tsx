import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrganDonors, getVerifiedOrganRequests } from "@/src/backend/services/seoData";
import { cityToSlug, jsonLdScript, maskPublicPhone, organFromSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
type Params = { organType: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { organType } = await params;
  const organ = organFromSlug(organType);
  if (!organ) return { title: "Organ support", robots: { index: false, follow: true } };
  return {
    title: `${organ} Donor Support | Ethical Organ Donation Network`,
    description: `Find public ${organ} donor support and verified ${organ} request links. BloodNet supports lawful donation connection only.`,
    alternates: { canonical: `/organ/${organType}` },
  };
}

export default async function OrganTypePage({ params }: { params: Promise<Params> }) {
  const { organType } = await params;
  const organ = organFromSlug(organType);
  if (!organ) notFound();
  const [donors, requests] = await Promise.all([getOrganDonors(organType), getVerifiedOrganRequests(organType)]);
  if (donors.length === 0 && requests.length === 0) notFound();
  const cities = Array.from(new Map([...donors, ...requests].map((row) => [`${row.location_country}::${row.location_city}`, row])).values()).slice(0, 16);
  const faq = [
    [`Can I find ${organ} donation support here?`, `BloodNet lists public donor support and verified request pages for ${organ} where data is available.`],
    ["Does BloodNet sell organs?", "No. Organ selling, buying, brokering, or trading is illegal and strictly prohibited."],
  ];
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript({ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) })} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="text-4xl font-black md:text-6xl">{organ} Donor Support</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Browse {organ} donor support and verified organ request pages. All coordination must follow hospital, legal, and licensed medical requirements.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="text-3xl font-black">Cities with {organ} Data</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cities.map((row) => <Link key={`${row.location_country}-${row.location_city}`} href={`/organ/${organType}/${cityToSlug(row.location_city)}`} className="rounded-[8px] bg-white p-5 font-black shadow-card">{row.location_city}, {row.location_country}</Link>)}
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl font-black">Public {organ} Donor Entries</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {donors.slice(0, 12).map((donor) => (
            <article key={`${donor.source_type}-${donor.id}`} className="rounded-[8px] bg-white p-5 shadow-card">
              <h3 className="text-xl font-black">{donor.name}</h3>
              <p className="mt-1 text-sm font-semibold text-gray-600">{donor.location_city}, {donor.location_country}</p>
              <p className="mt-2 text-sm font-semibold text-gray-600">Contact: {maskPublicPhone(donor.mobile)}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
