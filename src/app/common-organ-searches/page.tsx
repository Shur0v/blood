import type { Metadata } from "next";
import Link from "next/link";
import { HomeExperience } from "@/src/components/HomeExperience";
import { getOrganTypesWithData } from "@/src/backend/services/seoData";
import { organFromSlug } from "@/src/lib/seoRouting";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Most Common Organ Searches | Global Organ Support Discovery",
  description:
    "Browse the most common organ donor and verified request searches, then continue with the full BloodNet landing experience.",
  alternates: { canonical: "/common-organ-searches" },
};

export default async function CommonOrganSearchesPage() {
  const organSlugs = await getOrganTypesWithData();

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pt-20 pb-14">
        <section className="rounded-[8px] border border-border/20 bg-white/80 p-6 shadow-card">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">Most Common Organ Searches</h1>
          <p className="mt-3 max-w-3xl text-sm font-medium text-gray-600 md:text-base">
            Quick links for high-demand organ support pages. Open a donor or request path and continue with the complete landing page below.
          </p>

          <h2 className="mt-8 text-xl font-black text-gray-900">Top Organ Searches</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {organSlugs.map((slug) => (
              <Link
                key={slug}
                href={`/organ/${slug}`}
                className="rounded-[8px] border border-border/20 bg-white px-4 py-3 text-sm font-bold text-gray-900 shadow-sm"
              >
                {organFromSlug(slug) || slug} donors
              </Link>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-black text-gray-900">Verified Request Search</h2>
          <div className="mt-4">
            <Link
              href="/organ/request"
              className="inline-flex rounded-[8px] bg-primary-dark px-5 py-3 text-sm font-black uppercase tracking-widest text-white"
            >
              Browse Verified Organ Requests
            </Link>
          </div>
        </section>
      </main>

      <HomeExperience />
    </>
  );
}

