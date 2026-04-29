8import type { Metadata } from "next";
import Link from "next/link";
import { getOrganTypesWithData } from "@/src/backend/services/seoData";
import { organFromSlug } from "@/src/lib/seoRouting";

export const revalidate = 1800;
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Organ Donor Directory | Ethical Donor Connection Pages",
  description: "Browse organ donor support pages by organ type. BloodNet supports lawful donation awareness and never supports organ trade.",
  alternates: { canonical: "/organ/donor" },
};

export default async function OrganDonorPage() {
  const organSlugs = await getOrganTypesWithData();
  return (
    <main className="min-h-screen bg-bg text-gray-900">
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h1 className="text-4xl font-black md:text-6xl">Organ Donor Directory</h1>
        <p className="mt-5 max-w-3xl text-lg font-semibold leading-8 text-gray-600">
          Explore public organ donor support pages. All coordination must follow local law, hospital requirements, and licensed medical guidance.
        </p>
      </section>
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {organSlugs.map((slug) => <Link key={slug} href={`/organ/${slug}`} className="rounded-[8px] bg-white p-5 text-2xl font-black shadow-card">{organFromSlug(slug) || slug}</Link>)}
        </div>
      </section>
    </main>
  );
}
