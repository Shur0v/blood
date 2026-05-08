import type { Metadata } from "next";
import { getPrisma } from "@/src/backend/config/db";
import { REGIONS } from "@/src/lib/regions";

export const dynamic = "force-dynamic";
export const revalidate = 300;

type GlobalStats = {
  verifiedDonors: number;
  successfulTransplants: number;
  activeRequests: number;
};

const getGlobalStats = async (): Promise<GlobalStats> => {
  const prisma = getPrisma();

  const [users, manual, settings, organRequests, aidRequests] = await Promise.all([
    prisma.user.count({ where: { is_active_donor: true, verification_status: "VERIFIED" } }),
    prisma.manualBloodDonor.count({ where: { is_active_donor: true } }),
    prisma.platformSettings.findFirst({
      orderBy: [{ updated_at: "desc" }, { id: "desc" }],
      select: { completed_ops: true },
    }),
    prisma.organRequest.count({ where: { status: { in: ["PENDING", "VERIFIED"] } } }),
    prisma.medicalAidRequest.count({ where: { status: "PENDING" } }),
  ]);

  return {
    verifiedDonors: users + manual,
    successfulTransplants: Number(settings?.completed_ops ?? 0),
    activeRequests: organRequests + aidRequests,
  };
};

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Global Search Entry | Emergency Blood Donor Finder & Organ Registry",
    description:
      "Emergency Blood Donor Finder, Urgent O-Negative Blood Request, and Global Organ Donor Registry with live global trust metrics for India, Pakistan, Nepal, and Bangladesh.",
    alternates: {
      canonical: "/global-search-entry",
      languages: {
        "en-IN": "/india",
        "en-PK": "/pakistan",
        "en-NP": "/nepal",
        "bn-BD": "/bangladesh",
        "x-default": "/global-search-entry",
      },
    },
    openGraph: {
      type: "website",
      title: "Emergency Blood Donor Finder | Global Search Entry",
      description:
        "Live verified donor counts, active requests, and global organ donor registry access with city-intent discovery.",
      url: "https://bloodnet.live/global-search-entry",
    },
  };
}

export default async function GlobalSearchEntryPage() {
  const stats = await getGlobalStats();

  return (
    <>
      <main className="mx-auto max-w-7xl px-4 pt-16 pb-10">
        <section className="min-h-[15vh] rounded-[8px] border border-border/20 bg-white/90 p-6 shadow-card">
          <h1 className="text-3xl font-black tracking-tight text-gray-900 md:text-4xl">
            Emergency Blood Donor Finder
          </h1>
          <h2 className="mt-3 text-lg font-black text-primary-dark md:text-2xl">
            Urgent O-Negative Blood Request | Global Organ Donor Registry
          </h2>
          <p className="mt-3 max-w-4xl text-sm font-medium leading-7 text-gray-700 md:text-base">
            Built for fast donor discovery across India, Pakistan, Nepal, and Bangladesh with city-level search intent:
            blood donation centers near me, register as an organ donor online, and emergency platelet donation.
          </p>
        </section>

        <section className="mt-4 rounded-[8px] bg-gray-900 p-4 text-white shadow-card">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-[8px] border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Verified Donors</p>
              <p className="mt-1 text-3xl font-black">{stats.verifiedDonors.toLocaleString()}</p>
            </div>
            <div className="rounded-[8px] border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Successful Transplants</p>
              <p className="mt-1 text-3xl font-black">{stats.successfulTransplants.toLocaleString()}</p>
            </div>
            <div className="rounded-[8px] border border-white/15 bg-white/5 p-4">
              <p className="text-xs font-bold uppercase tracking-widest text-white/70">Active Requests</p>
              <p className="mt-1 text-3xl font-black">{stats.activeRequests.toLocaleString()}</p>
            </div>
          </div>
        </section>

        <section className="mt-5 rounded-[8px] border border-border/20 bg-white/80 p-5 shadow-card">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Common Search Tags</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            <h3 className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">
              Can I donate blood after a tattoo?
            </h3>
            {REGIONS.map((region) => (
              <h3
                key={region.slug}
                className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800"
              >
                O-negative blood donors in {region.label}
              </h3>
            ))}
            <h3 className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">
              Kidney donor requirement list
            </h3>
          </div>
        </section>

        <section className="mt-5 rounded-[8px] border border-border/20 bg-white/80 p-5 shadow-card">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-500">Country Keyword Hubs</h3>
          <p className="mt-3 text-sm font-medium text-gray-700">
            High-authority internal links to regional long-tail collections for USA, UK, Spain, Netherlands, Italy, Poland, and Australia.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <a href="/country-keyword-hubs/usa" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">USA Keyword Hub</a>
            <a href="/country-keyword-hubs/uk" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">UK Keyword Hub</a>
            <a href="/country-keyword-hubs/spain" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">Spain Keyword Hub</a>
            <a href="/country-keyword-hubs/netherlands" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">Netherlands Keyword Hub</a>
            <a href="/country-keyword-hubs/italy" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">Italy Keyword Hub</a>
            <a href="/country-keyword-hubs/poland" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">Poland Keyword Hub</a>
            <a href="/country-keyword-hubs/australia" className="rounded-[8px] border border-border/20 bg-white px-3 py-2 text-sm font-bold text-gray-800">Australia Keyword Hub</a>
          </div>
        </section>
      </main>

    </>
  );
}

