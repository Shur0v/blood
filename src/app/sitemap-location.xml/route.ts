import { getPrisma } from "@/src/backend/config/db";
import { getPublicBaseUrl } from "@/src/backend/config/env";
import { toLocationSlug } from "@/src/backend/utils/locationSlug";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

interface CityRow {
  city: string | null;
  country: string | null;
}

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const now = new Date();
  try {
    const prisma = getPrisma();
    const rows = await prisma.$queryRaw<CityRow[]>`
      SELECT city, country FROM (
        SELECT usc.city, usc.country FROM "UserServiceCity" usc
        UNION
        SELECT u.location_city AS city, u.location_country AS country FROM "User" u
        UNION
        SELECT mbd.location_city AS city, mbd.location_country AS country FROM "ManualBloodDonor" mbd
        UNION
        SELECT mod.location_city AS city, mod.location_country AS country FROM "ManualOrganDonor" mod
      ) loc
    `;

    const seen = new Set<string>();
    const urls: Array<{ url: string; lastModified: Date }> = [];
    for (const row of rows) {
      const city = (row.city || "").trim();
      const country = (row.country || "").trim();
      if (!city || !country) continue;
      const citySlug = toLocationSlug(city);
      const countrySlug = toLocationSlug(country);
      if (!citySlug || !countrySlug) continue;
      const key = `${countrySlug}/${citySlug}`;
      if (seen.has(key)) continue;
      seen.add(key);

      urls.push({ url: `${baseUrl}/blood-donors/${countrySlug}/${citySlug}`, lastModified: now });
      urls.push({ url: `${baseUrl}/organ-donors/${countrySlug}/${citySlug}`, lastModified: now });
    }
    return renderUrlSetXml(urls);
  } catch {
    return renderUrlSetXml([]);
  }
}
