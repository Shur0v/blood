import { HomeExperience } from "@/src/app/page";
import { fromLocationSlug } from "@/src/backend/utils/locationSlug";

export const dynamic = "force-dynamic";

export default async function OrganCityLandingPage({ params }: { params: Promise<{ country: string; city: string }> }) {
  const p = await params;
  const country = fromLocationSlug(p.country);
  return <HomeExperience forcedCountry={country} />;
}
