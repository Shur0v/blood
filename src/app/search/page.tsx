import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { bloodGroupToSlug, cityToSlug, organToSlug } from "@/src/lib/seoRouting";

export const metadata: Metadata = {
  title: "Search BloodNet",
  description: "Search BloodNet by blood group, city, country, or organ type.",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const blood = typeof params.blood === "string" ? params.blood : "";
  const city = typeof params.city === "string" ? params.city : "";
  const organ = typeof params.organ === "string" ? params.organ : "";

  const citySlug = city ? cityToSlug(city) : "";
  const bloodSlug = blood ? bloodGroupToSlug(blood) : null;
  const organSlug = organ ? organToSlug(organ) : null;

  if (bloodSlug && citySlug) redirect(`/blood/${bloodSlug}/${citySlug}`);
  if (bloodSlug) redirect(`/blood/${bloodSlug}`);
  if (organSlug && citySlug) redirect(`/organ/request/${organSlug}/${citySlug}`);
  if (organSlug) redirect(`/organ/request/${organSlug}`);
  if (citySlug) redirect(`/city/${citySlug}`);

  return (
    <main className="min-h-screen bg-bg px-4 py-20 text-gray-900">
      <section className="mx-auto max-w-3xl">
        <h1 className="text-4xl font-black">Search BloodNet</h1>
        <form className="mt-8 grid gap-4 rounded-[8px] bg-white p-6 shadow-card">
          <input name="blood" placeholder="Blood group, e.g. O+" className="rounded-[8px] border border-gray-200 px-4 py-3 font-semibold" />
          <input name="city" placeholder="City, e.g. Dhaka" className="rounded-[8px] border border-gray-200 px-4 py-3 font-semibold" />
          <input name="organ" placeholder="Organ type, e.g. Kidney" className="rounded-[8px] border border-gray-200 px-4 py-3 font-semibold" />
          <button className="rounded-[8px] bg-primary px-5 py-3 text-sm font-black uppercase tracking-widest text-white">Search</button>
        </form>
      </section>
    </main>
  );
}
