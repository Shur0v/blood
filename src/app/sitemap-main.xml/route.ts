import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  const now = new Date();
  return renderUrlSetXml([
    { url: `${baseUrl}/`, lastModified: now },
    { url: `${baseUrl}/blood`, lastModified: now },
    { url: `${baseUrl}/organ`, lastModified: now },
    { url: `${baseUrl}/blog`, lastModified: now },
    { url: `${baseUrl}/faq`, lastModified: now },
    { url: `${baseUrl}/contact`, lastModified: now },
    { url: `${baseUrl}/about`, lastModified: now },
    { url: `${baseUrl}/global-search-entry`, lastModified: now },
    { url: `${baseUrl}/common-blood-searches`, lastModified: now },
    { url: `${baseUrl}/common-organ-searches`, lastModified: now },
    { url: `${baseUrl}/countries`, lastModified: now },
    { url: `${baseUrl}/cities`, lastModified: now },
    { url: `${baseUrl}/statistics`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/usa`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/uk`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/spain`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/netherlands`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/italy`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/poland`, lastModified: now },
    { url: `${baseUrl}/country-keyword-hubs/australia`, lastModified: now },
    { url: `${baseUrl}/privacy`, lastModified: now },
    { url: `${baseUrl}/privacy-policy`, lastModified: now },
    { url: `${baseUrl}/terms`, lastModified: now },
    { url: `${baseUrl}/policy.txt`, lastModified: now },
  ]);
}
