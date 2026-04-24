import { MetadataRoute } from 'next';
import { getPrisma } from '@/src/backend/config/db';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { getPublicBaseUrl } from '@/src/backend/config/env';

interface CityRow {
  city: string | null;
  country: string | null;
}

const buildCityRoutes = (baseUrl: string, rows: CityRow[]) => {
  const seen = new Set<string>();
  const routes: MetadataRoute.Sitemap = [];

  for (const row of rows) {
    const city = (row.city || '').trim();
    const country = (row.country || '').trim();
    if (!city || !country) continue;

    const citySlug = toLocationSlug(city);
    const countrySlug = toLocationSlug(country);
    if (!citySlug || !countrySlug) continue;

    const key = `${countrySlug}/${citySlug}`;
    if (seen.has(key)) continue;
    seen.add(key);

    routes.push({
      url: `${baseUrl}/blood-donors/${countrySlug}/${citySlug}`,
      lastModified: new Date(),
    });
    routes.push({
      url: `${baseUrl}/organ-donors/${countrySlug}/${citySlug}`,
      lastModified: new Date(),
    });
  }

  return routes;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: new Date() },
    { url: `${baseUrl}/blog`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
  ];

  try {
    const prisma = getPrisma();
    const [blogs, cityRows] = await Promise.all([
      prisma.blog.findMany({
        where: { status: 'PUBLISHED', slug: { not: null } },
        select: { slug: true, updated_at: true },
      }),
      prisma.$queryRaw<CityRow[]>`
        SELECT city, country FROM (
          SELECT usc.city, usc.country FROM "UserServiceCity" usc
          UNION
          SELECT u.location_city AS city, u.location_country AS country FROM "User" u
          UNION
          SELECT mbd.location_city AS city, mbd.location_country AS country FROM "ManualBloodDonor" mbd
          UNION
          SELECT mod.location_city AS city, mod.location_country AS country FROM "ManualOrganDonor" mod
        ) loc
      `,
    ]);

    const blogRoutes: MetadataRoute.Sitemap = blogs
      .filter((row) => row.slug)
      .map((row) => ({
        url: `${baseUrl}/blog/${row.slug}`,
        lastModified: row.updated_at,
      }));

    const cityRoutes = buildCityRoutes(baseUrl, cityRows);
    return [...staticRoutes, ...blogRoutes, ...cityRoutes];
  } catch (error) {
    console.error('[sitemap] Falling back to static routes:', error);
    return staticRoutes;
  }

}
