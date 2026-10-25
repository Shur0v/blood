import {getPublicPageDates} from '@/src/backend/services/publicContent';
import { MetadataRoute } from 'next';
import { getPrisma } from '@/src/backend/config/db';
import { toLocationSlug } from '@/src/backend/utils/locationSlug';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { buildOrganRequestSlug, getBloodGroupCityCounts, getOrganDonors, getOrganTypesWithData, getVerifiedOrganRequests } from '@/src/backend/services/seoData';
import { bloodGroupToSlug, cityToSlug, countryToShortcut, organToSlug } from '@/src/lib/seoRouting';
import { REGIONS } from '@/src/lib/regions';
import { getDonorLocations, type DonorLocation } from '@/src/backend/services/donorLocations';

import {blogPageLastModified,publicBlogUrl} from '@/src/lib/blogDiscovery';
import {getRegionalPublicationDates,regionalLastModified} from '@/src/backend/services/regionalContent';
import {getHomepagePublicationDate} from '@/src/backend/services/homepageContent';

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
  const contentDates=await getPublicPageDates();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, changeFrequency: 'daily', priority: 1, lastModified:await getHomepagePublicationDate() },
    { url: `${baseUrl}/us`, changeFrequency: 'daily', priority: 0.85 },
    { url: `${baseUrl}/blood`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ/donor`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/organ/request`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${baseUrl}/organ/registry`, changeFrequency: 'weekly', priority: 0.8 },
    ...['medical-profile','medical-reports','prescriptions','doctor-appointments'].map(key=>({url:baseUrl+'/'+key,lastModified:contentDates.get(key)})),
    { url: `${baseUrl}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/faq`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contact`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/terms`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/privacy`, changeFrequency: 'monthly', priority: 0.5 },


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

  for(const entry of staticRoutes){const date=contentDates.get(new URL(entry.url).pathname.slice(1));if(date)entry.lastModified=date;}
  try {
    const prisma = getPrisma();
    const [blogs, cityRows, bloodRows, organTypes, organDonors, organRequests] = await Promise.all([
      prisma.blog.findMany({
        where: { status: 'PUBLISHED', slug: { not: null } },
        select: { slug: true, canonical_url:true, updated_at: true },
      }),
      getDonorLocations(),
      getBloodGroupCityCounts(),
      getOrganTypesWithData(),
      getOrganDonors(),
      getVerifiedOrganRequests(),
    ]);

    const blogRoutes: MetadataRoute.Sitemap = blogs
      .filter((row) => publicBlogUrl(row,baseUrl))
      .map((row) => ({
        url: publicBlogUrl(row,baseUrl)!,
        lastModified: blogPageLastModified(row.updated_at),
      }));

    const cityRoutes = buildCityRoutes(baseUrl, cityRows);
    const regionalDates=await getRegionalPublicationDates();
    for(const region of REGIONS){const route=staticRoutes.find(entry=>entry.url===baseUrl+'/'+region.slug);if(route)route.lastModified=regionalLastModified(region.country,undefined,new Date(0),regionalDates); }
    for(const row of cityRows){
      const modified=regionalLastModified(row.country,row.city,row.updatedAt,regionalDates);
      for(const route of [...staticRoutes,...cityRoutes]){
        const value=route.url===baseUrl+'/nepal'&&row.country.toLowerCase()==='nepal'?regionalLastModified(row.country,undefined,row.updatedAt,regionalDates):route.url===baseUrl+`/blood-donors/${toLocationSlug(row.country)}/${cityToSlug(row.city)}`?modified:null;
        if(value)route.lastModified=new Date(Math.max(value.getTime(),new Date(route.lastModified||0).getTime()));
      }
    }
    const seenRoutes = new Set<string>();
    const addRoute = (routes: MetadataRoute.Sitemap, url: string, lastModified: Date | null | undefined, priority = 0.8) => {
      if (seenRoutes.has(url)) return;
      seenRoutes.add(url);
      routes.push({ url, ...(lastModified ? {lastModified} : {}), changeFrequency: 'daily', priority });
    };
    const programmaticRoutes: MetadataRoute.Sitemap = [];

    for (const group of new Set(bloodRows.map(row => row.blood_group))) {
      const slug = bloodGroupToSlug(group);
      if (slug) addRoute(programmaticRoutes, `${baseUrl}/blood/${slug}`, undefined, 0.75);
    }

    for (const row of bloodRows) {
      const groupSlug = bloodGroupToSlug(row.blood_group);
      const citySlug = cityToSlug(row.city);
      if (!groupSlug || !citySlug) continue;
      const modified=regionalLastModified(row.country,row.city,row.updated_at,regionalDates);
      addRoute(programmaticRoutes, `${baseUrl}/blood/${citySlug}`, modified, 0.85);
      addRoute(programmaticRoutes, `${baseUrl}/city/${citySlug}`, modified, 0.9);
      addRoute(programmaticRoutes, `${baseUrl}/blood/${groupSlug}/${citySlug}`, modified, 0.85);
      const shortcut = countryToShortcut(row.country);
      if (shortcut) addRoute(programmaticRoutes, `${baseUrl}/${shortcut}`, row.updated_at, 0.9);
    }

    for (const organSlug of organTypes) {
      addRoute(programmaticRoutes, `${baseUrl}/organ/${organSlug}`, undefined, 0.8);

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

    return [...new Map([...staticRoutes, ...blogRoutes, ...cityRoutes, ...programmaticRoutes].map(route=>[route.url,route])).values()];
  } catch (error) {
    console.error('[sitemap] Falling back to static routes:', error);
    return staticRoutes;
  }

}
