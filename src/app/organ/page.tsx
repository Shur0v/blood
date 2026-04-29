import type { Metadata } from "next";
import Link from "next/link";
import { getOrganTypesWithData } from "@/src/backend/services/seoData";
import { organFromSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organ Donation Support and Verified Request Registry",
  description: "Learn about BloodNet organ donor awareness, verified organ request pages, and ethical donor-recipient connection support.",
  alternates: { canonical: "/organ" },
};

export default async function OrganPage() {
  const organSlugs = await getOrganTypesWithData();
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Ethical organ donation support</p>
        <h1 className="mt-4 text-4xl font-black tracking-tight md:text-6xl">Organ Donor Network and Verified Request Registry</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          BloodNet helps families, patients, donors, and supporters discover verified organ donation support pages. Organ selling, buying, brokering, or trading is strictly prohibited.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/organ/request" className="rounded-[8px] bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white">View Requests</Link>
          <Link href="/organ/registry" className="rounded-[8px] bg-white px-5 py-3 text-sm font-black uppercase tracking-widest shadow-card">Registry Guide</Link>
          <Link href="/organ/donor" className="rounded-[8px] bg-white px-5 py-3 text-sm font-black uppercase tracking-widest shadow-card">Donor Pages</Link>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <h2 className="text-3xl font-black">Organ Support Pages</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organSlugs.map((slug) => (
            <Link key={slug} href={`/organ/${slug}`} className="rounded-[8px] bg-white p-5 shadow-card">
              <h3 className="text-2xl font-black">{organFromSlug(slug) || slug}</h3>
              <p className="mt-2 text-sm font-semibold text-gray-600">Open donor and verified request pages for this organ type.</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
