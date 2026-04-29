import type { Metadata } from "next";
import Link from "next/link";
import { buildOrganRequestSlug, getVerifiedOrganRequests } from "@/src/backend/services/seoData";
import { organToSlug, maskPublicPhone } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Verified Organ Donor Requests | Organ Donation Registry",
  description: "View verified public organ donation requests submitted by patients or families and reviewed by BloodNet admins.",
  alternates: { canonical: "/organ/request" },
};

export default async function OrganRequestIndexPage() {
  const requests = await getVerifiedOrganRequests();
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Admin-reviewed registry</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Verified Organ Donor Requests</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          These public requests are submitted by patients or families and approved before listing. BloodNet supports ethical connection only, never organ trade.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 md:grid-cols-2">
          {requests.map((request) => {
            const organSlug = organToSlug(request.organ_type);
            return (
              <article key={request.id} className="rounded-[8px] bg-white p-5 shadow-card">
                <p className="text-xs font-black uppercase tracking-widest text-primary">Verified request</p>
                <h2 className="mt-2 text-2xl font-black">{request.organ_type} request in {request.location_city}</h2>
                <p className="mt-2 text-sm font-semibold text-gray-600">{request.location_city}, {request.location_country}</p>
                <p className="mt-2 text-sm font-semibold text-gray-600">Safe contact: {maskPublicPhone(request.contact)}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/organ/request/details/${buildOrganRequestSlug(request)}`} className="rounded-[8px] bg-primary px-4 py-2 text-xs font-black uppercase tracking-widest text-white">Details</Link>
                  {organSlug && <Link href={`/organ/request/${organSlug}`} className="rounded-[8px] bg-gray-100 px-4 py-2 text-xs font-black uppercase tracking-widest">More {request.organ_type}</Link>}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}
