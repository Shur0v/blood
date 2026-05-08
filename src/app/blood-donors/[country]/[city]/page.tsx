import { HomeExperience } from "@/src/components/HomeExperience";
import { fromLocationSlug } from "@/src/backend/utils/locationSlug";

export const dynamic = "force-dynamic";

export default async function BloodCityLandingPage({ params }: { params: Promise<{ country: string; city: string }> }) {
  const p = await params;
  const country = fromLocationSlug(p.country);
  return <HomeExperience forcedCountry={country} />;
}
