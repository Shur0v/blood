import type { Metadata } from "next";
import { BloodGroupSeoPage, CityBloodSeoPage } from "@/src/components/ProgrammaticBloodSeoPage";
import { getBloodGroupSummary, getCityBloodSummary } from "@/src/backend/services/seoData";
import { bloodGroupFromSlug, cityFromSlug } from "@/src/lib/seoRouting";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

type Params = { slug: string };

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const bloodGroup = bloodGroupFromSlug(slug);

  try {
    if (bloodGroup) {
      const rows = await getBloodGroupSummary(bloodGroup);
      const total = rows.reduce((sum, row) => sum + Number(row.total ?? 0), 0);
      return {
        title: `${bloodGroup} Blood Donors by City | Find Active Donor Support`,
        description: `Browse ${Number(total).toLocaleString()} ${bloodGroup} blood donor entries by active city. Find urgent ${bloodGroup} blood donor support through BloodNet.`,
        alternates: { canonical: `/blood/${slug.toLowerCase()}` },
        robots: rows.length ? { index: true, follow: true } : { index: false, follow: true },
      };
    }

    const rows = await getCityBloodSummary(slug);
    const city = rows[0]?.city || cityFromSlug(slug);
    const country = rows[0]?.country;
    return {
      title: `Blood Donors in ${city} | Urgent Blood and Organ Donation Support`,
      description: `Find active blood donors${country ? ` in ${city}, ${country}` : ` in ${city}`}. Search available blood groups and urgent blood donor pages through BloodNet.`,
      alternates: { canonical: `/blood/${slug.toLowerCase()}` },
      robots: rows.length ? { index: true, follow: true } : { index: false, follow: true },
    };
  } catch {
    return {
      title: bloodGroup ? `${bloodGroup} Blood Donors by City` : `Blood Donors in ${cityFromSlug(slug)}`,
      robots: { index: false, follow: true },
    };
  }
}

export default async function BloodSlugPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const normalizedSlug = slug.toLowerCase();
  const bloodGroup = bloodGroupFromSlug(normalizedSlug);
  if (bloodGroup) return <BloodGroupSeoPage bloodGroup={bloodGroup} />;
  return <CityBloodSeoPage citySlug={normalizedSlug} />;
}
