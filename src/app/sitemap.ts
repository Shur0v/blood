import { MetadataRoute } from 'next';
import { getPrisma } from '@/src/backend/config/db';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { buildOrganRequestSlug, getBloodGroupCityCounts, getOrganDonors, getOrganTypesWithData, getVerifiedOrganRequests } from '@/src/backend/services/seoData';
import { BLOOD_GROUPS, COUNTRY_SHORTCUTS, bloodGroupToSlug, cityToSlug, countryToShortcut, organToSlug } from '@/src/lib/seoRouting';
import { REGIONS } from '@/src/lib/regions';
import { getDonorLocations, type DonorLocation } from '@/src/backend/services/donorLocations';

export const dynamic = 'force-dynamic';

interface CityRow {
  city: string | null;
  country: string | null;
}

const buildCityRoutes = (baseUrl: string, rows: DonorLocation[]) => {
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

    if (row.bloodCount > 0) routes.push({
      url: `${baseUrl}/blood-donors/${countrySlug}/${citySlug}`,
      lastModified: row.updatedAt,
    });
    if (row.organCount > 0) routes.push({
      url: `${baseUrl}/organ-donors/${countrySlug}/${citySlug}`,
      lastModified: row.updatedAt,
    });
  }

  return routes;
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getPublicBaseUrl();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/blood`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ/donor`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/organ/request`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ/registry`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy-policy`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/policy.txt`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/safety-policy`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/medical-disclaimer`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/organ-donation-ethics`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/how-it-works`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/register-donor`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/request-blood`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/request-organ`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/emergency-blood-help`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/statistics`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/countries`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/guides`, changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/network`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/cities`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${baseUrl}/common-blood-searches`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/common-organ-searches`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${baseUrl}/global-search-entry`, changeFrequency: 'daily', priority: 0.9 },
    ...REGIONS.map((region) => ({
      url: `${baseUrl}/${region.slug}`,
      changeFrequency: 'daily' as const,
      priority: 0.85,
    })),
  ];

  try {
    const prisma = getPrisma();
    const [blogs, cityRows, bloodRows, organTypes, organDonors, organRequests] = await Promise.all([
      prisma.blog.findMany({
        where: { status: 'PUBLISHED', slug: { not: null } },
        select: { slug: true, updated_at: true },
      }),
      getDonorLocations(),
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
      routes.push({ url, ...(lastModified ? {lastModified} : {}), changeFrequency: 'daily', priority });
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
