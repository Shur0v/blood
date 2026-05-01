import { MetadataRoute } from 'next';
import { getPrisma } from '@/src/backend/config/db';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { buildOrganRequestSlug, getBloodGroupCityCounts, getOrganDonors, getOrganTypesWithData, getVerifiedOrganRequests } from '@/src/backend/services/seoData';
import { BLOOD_GROUPS, COUNTRY_SHORTCUTS, bloodGroupToSlug, cityToSlug, countryToShortcut, organToSlug } from '@/src/lib/seoRouting';

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
    { url: `${baseUrl}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blood`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ/donor`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/organ/request`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ/registry`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/safety-policy`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/medical-disclaimer`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/organ-donation-ethics`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/how-it-works`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/register-donor`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/request-blood`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/request-organ`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/blood-donation-guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/organ-donation-guide`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/emergency-blood-help`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/statistics`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/countries`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/cities`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
  ];

  try {
    const prisma = getPrisma();
    const [blogs, cityRows, bloodRows, organTypes, organDonors, organRequests] = await Promise.all([
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
      getBloodGroupCityCounts(),
      getOrganTypesWithData(),
      getOrganDonors(),
      getVerifiedOrganRequests(),
    ]);

    const blogRoutes: MetadataRoute.Sitemap = blogs
      .filter((row) => row.slug)
      .map((row) => ({
        url: `${baseUrl}/blog/${row.slug}`,
        lastModified: row.updated_at,
      }));

    const cityRoutes = buildCityRoutes(baseUrl, cityRows);
    const seenRoutes = new Set<string>();
    const addRoute = (routes: MetadataRoute.Sitemap, url: string, lastModified: Date | null | undefined, priority = 0.8) => {
      if (seenRoutes.has(url)) return;
      seenRoutes.add(url);
      routes.push({ url, lastModified: lastModified || new Date(), changeFrequency: 'daily', priority });
    };
    const programmaticRoutes: MetadataRoute.Sitemap = [];

    for (const group of BLOOD_GROUPS) {
      const slug = bloodGroupToSlug(group);
      if (slug) addRoute(programmaticRoutes, `${baseUrl}/blood/${slug}`, new Date(), 0.75);
    }

    for (const row of bloodRows) {
      const groupSlug = bloodGroupToSlug(row.blood_group);
      const citySlug = cityToSlug(row.city);
      if (!groupSlug || !citySlug) continue;
      addRoute(programmaticRoutes, `${baseUrl}/blood/${citySlug}`, row.updated_at, 0.85);
      addRoute(programmaticRoutes, `${baseUrl}/city/${citySlug}`, row.updated_at, 0.9);
      addRoute(programmaticRoutes, `${baseUrl}/blood/${groupSlug}/${citySlug}`, row.updated_at, 0.85);
      const shortcut = countryToShortcut(row.country);
      if (shortcut) addRoute(programmaticRoutes, `${baseUrl}/${shortcut}`, row.updated_at, 0.9);
    }

    for (const shortcut of Object.keys(COUNTRY_SHORTCUTS)) {
      addRoute(programmaticRoutes, `${baseUrl}/${shortcut}`, new Date(), 0.65);
    }

    for (const organSlug of organTypes) {
      addRoute(programmaticRoutes, `${baseUrl}/organ/${organSlug}`, new Date(), 0.8);
      addRoute(programmaticRoutes, `${baseUrl}/organ/request/${organSlug}`, new Date(), 0.8);
    }

    for (const donor of organDonors) {
      const organSlug = organToSlug(donor.organ_type);
      if (!organSlug) continue;
      addRoute(programmaticRoutes, `${baseUrl}/organ/${organSlug}/${cityToSlug(donor.location_city)}`, donor.updated_at, 0.75);
    }

    for (const request of organRequests) {
      const organSlug = organToSlug(request.organ_type);
      if (!organSlug) continue;
      addRoute(programmaticRoutes, `${baseUrl}/organ/request/${organSlug}/${cityToSlug(request.location_city)}`, request.created_at, 0.8);
      addRoute(programmaticRoutes, `${baseUrl}/organ/request/details/${buildOrganRequestSlug(request)}`, request.created_at, 0.8);
    }

    return [...staticRoutes, ...blogRoutes, ...cityRoutes, ...programmaticRoutes];
  } catch (error) {
    console.error('[sitemap] Falling back to static routes:', error);
    return staticRoutes;
  }

}
