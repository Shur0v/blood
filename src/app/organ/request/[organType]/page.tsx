import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buildOrganRequestSlug, getVerifiedOrganRequests } from "@/src/backend/services/seoData";
import { cityToSlug, jsonLdScript, maskPublicPhone, organFromSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
type Params = { organType: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { organType } = await params;
  const organ = organFromSlug(organType);
  if (!organ) return { title: "Organ requests", robots: { index: false, follow: true } };
  return {
    title: `Verified ${organ} Donor Requests | Organ Donation Registry`,
    description: `View verified ${organ} donation requests. Connect with approved patients or families looking for ethical organ donation support.`,
    alternates: { canonical: `/organ/request/${organType}` },
  };
}

export default async function OrganRequestTypePage({ params }: { params: Promise<Params> }) {
  const { organType } = await params;
  const organ = organFromSlug(organType);
  if (!organ) notFound();
  const requests = await getVerifiedOrganRequests(organType);
  if (requests.length === 0) notFound();
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript({ "@context": "https://schema.org", "@type": "ItemList", name: `Verified ${organ} requests`, numberOfItems: requests.length })} />
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="text-4xl font-black md:text-6xl">Verified {organ} Donor Requests</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          View admin-approved {organ} requests. These listings are for ethical connection and awareness only.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[8px] bg-white p-5 shadow-card">
              <p className="text-xs font-black uppercase tracking-widest text-primary">Verified request</p>
              <h2 className="mt-2 text-2xl font-black">{request.organ_type} request in {request.location_city}</h2>
              <p className="mt-2 text-sm font-semibold text-gray-600">{request.location_city}, {request.location_country}</p>
              <p className="mt-2 text-sm font-semibold text-gray-600">Safe contact: {maskPublicPhone(request.contact)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/organ/request/details/${buildOrganRequestSlug(request)}`} className="rounded-[8px] bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Details</Link>
                <Link href={`/organ/request/${organType}/${cityToSlug(request.location_city)}`} className="rounded-[8px] bg-gray-100 px-4 py-2 text-xs font-black uppercase tracking-widest">{request.location_city}</Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
