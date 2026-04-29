import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getOrganDonors, getVerifiedOrganRequests } from "@/src/backend/services/seoData";
import { cityFromSlug, jsonLdScript, maskPublicPhone, organFromSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
type Params = { organType: string; city: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { organType, city } = await params;
  const organ = organFromSlug(organType);
  const cityName = cityFromSlug(city);
  if (!organ) return { title: "Organ support", robots: { index: false, follow: true } };
  return {
    title: `${organ} Donor Support in ${cityName} | Ethical Organ Donation Network`,
    description: `Find public ${organ} donor support and verified request links in ${cityName}. BloodNet supports lawful donation connection only.`,
    alternates: { canonical: `/organ/${organType}/${city}` },
  };
}

export default async function OrganTypeCityPage({ params }: { params: Promise<Params> }) {
  const { organType, city } = await params;
  const organ = organFromSlug(organType);
  if (!organ) notFound();
  const [donors, requests] = await Promise.all([getOrganDonors(organType, city), getVerifiedOrganRequests(organType, city)]);
  if (donors.length === 0 && requests.length === 0) notFound();
  const cityName = donors[0]?.location_city || requests[0]?.location_city || cityFromSlug(city);
  const country = donors[0]?.location_country || requests[0]?.location_country || "";
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript({ "@context": "https://schema.org", "@type": "MedicalWebPage", name: `${organ} donor support in ${cityName}`, description: `Public ${organ} donor support and verified request data in ${cityName}.` })} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="text-4xl font-black md:text-6xl">{organ} Donor Support in {cityName}</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Public {organ} donor support and verified request information for {cityName}{country ? `, ${country}` : ""}. BloodNet does not sell organs and does not replace licensed medical or legal approval.
        </p>
      </section>
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-24 md:grid-cols-2">
        <div>
          <h2 className="text-3xl font-black">Public Donor Entries</h2>
          <div className="mt-6 grid gap-4">
            {donors.map((donor) => (
              <article key={`${donor.source_type}-${donor.id}`} className="rounded-[8px] bg-white p-5 shadow-card">
                <h3 className="text-xl font-black">{donor.name}</h3>
                <p className="mt-1 text-sm font-semibold text-gray-600">{donor.location_city}, {donor.location_country}</p>
                <p className="mt-2 text-sm font-semibold text-gray-600">Contact: {maskPublicPhone(donor.mobile)}</p>
              </article>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-3xl font-black">Verified Requests</h2>
          <div className="mt-6 grid gap-4">
            {requests.map((request) => (
              <article key={request.id} className="rounded-[8px] bg-white p-5 shadow-card">
                <p className="text-xs font-black uppercase tracking-widest text-primary">Admin verified</p>
                <h3 className="mt-2 text-xl font-black">{request.organ_type} request</h3>
                <p className="mt-1 text-sm font-semibold text-gray-600">{request.location_city}, {request.location_country}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
