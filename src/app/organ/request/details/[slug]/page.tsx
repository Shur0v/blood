import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getVerifiedOrganRequestBySlug } from "@/src/backend/services/seoData";
import { jsonLdScript, maskPublicPhone, organToSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const request = await getVerifiedOrganRequestBySlug(slug);
  if (!request) return { title: "Organ request", robots: { index: false, follow: true } };
  const title = `Verified ${request.organ_type} Request in ${request.location_city} | BloodNet`;
  const description = `View a verified ${request.organ_type} donation request in ${request.location_city}, ${request.location_country}. Ethical connection support only.`;
  return { title, description, alternates: { canonical: `/organ/request/details/${slug}` } };
}

export default async function OrganRequestDetailsPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const request = await getVerifiedOrganRequestBySlug(slug);
  if (!request) notFound();
  const organSlug = organToSlug(request.organ_type);
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdScript({ "@context": "https://schema.org", "@type": "MedicalWebPage", name: `Verified ${request.organ_type} request in ${request.location_city}`, datePublished: request.created_at.toISOString() })} />
      <section className="mx-auto max-w-4xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Admin verified organ request</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Verified {request.organ_type} Request in {request.location_city}</h1>
        <p className="mt-5 text-lg font-semibold leading-8 text-gray-600">
          This public registry listing was approved for safe visibility. Sensitive medical details are limited by default.
        </p>
        <div className="mt-8 rounded-[8px] bg-white p-6 shadow-card">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div><dt className="text-sm font-bold text-gray-500">Location</dt><dd className="text-xl font-black">{request.location_city}, {request.location_country}</dd></div>
            <div><dt className="text-sm font-bold text-gray-500">Organ type</dt><dd className="text-xl font-black">{request.organ_type}</dd></div>
            <div><dt className="text-sm font-bold text-gray-500">Safe contact</dt><dd className="text-xl font-black">{maskPublicPhone(request.contact)}</dd></div>
            <div><dt className="text-sm font-bold text-gray-500">Published</dt><dd className="text-xl font-black">{request.created_at.toLocaleDateString()}</dd></div>
          </dl>
        </div>
        <div className="mt-8 rounded-[8px] border border-red-100 bg-red-50 p-5">
          <h2 className="text-2xl font-black">Safety and legal notice</h2>
          <p className="mt-3 font-semibold leading-7 text-gray-700">
            BloodNet is a free connection service. It does not provide medical treatment, emergency ambulance service, organ inventory confirmation, or legal transplant approval. Organ selling, buying, or brokering is prohibited.
          </p>
        </div>
        {organSlug && <a href={`/organ/request/${organSlug}`} className="mt-8 inline-flex rounded-[8px] bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white">More {request.organ_type} Requests</a>}
      </section>
    </main>
  );
}
