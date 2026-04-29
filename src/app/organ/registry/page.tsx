import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Verified Organ Request Registry | BloodNet",
  description: "Learn how BloodNet reviews and publishes verified organ pre-requests for ethical donation support and patient-family connection.",
  alternates: { canonical: "/organ/registry" },
};

export default function OrganRegistryPage() {
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-5xl px-4 py-20">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-primary">Registry guide</p>
        <h1 className="mt-4 text-4xl font-black md:text-6xl">Verified Organ Request Registry</h1>
        <p className="mt-5 text-lg font-semibold leading-8 text-gray-600">
          BloodNet allows patients or families to submit future organ needs or pre-requests. Admin-reviewed, verified requests may become public registry pages so interested donors or supporters can connect safely.
        </p>
        <div className="mt-8 rounded-[8px] border border-red-100 bg-white p-6 shadow-card">
          <h2 className="text-2xl font-black">Safety boundary</h2>
          <p className="mt-3 font-semibold leading-7 text-gray-600">
            BloodNet is a connection platform only. It does not provide treatment, transplant approval, legal authorization, organ inventory, or emergency medical service. Organ selling or buying is strictly prohibited.
          </p>
        </div>
        <Link href="/organ/request" className="mt-8 inline-flex rounded-[8px] bg-primary px-6 py-3 text-sm font-black uppercase tracking-widest text-white">View Verified Requests</Link>
      </section>
    </main>
  );
}
