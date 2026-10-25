import { getPublicBaseUrl } from "@/src/backend/config/env";
import { renderUrlSetXml } from "@/src/lib/sitemapXml";
import {getHomepagePublicationDate} from '@/src/backend/services/homepageContent';

export const dynamic='force-dynamic';

export async function GET() {
  const baseUrl = getPublicBaseUrl();
  return renderUrlSetXml([
    { url: `${baseUrl}/`, lastModified:await getHomepagePublicationDate() },
    { url: `${baseUrl}/blood` },
    { url: `${baseUrl}/organ` },
    { url: `${baseUrl}/blog` },
    { url: `${baseUrl}/faq` },
    { url: `${baseUrl}/contact` },
    { url: `${baseUrl}/about` },
    { url: `${baseUrl}/global-search-entry` },
    { url: `${baseUrl}/common-blood-searches` },
    { url: `${baseUrl}/common-organ-searches` },
    { url: `${baseUrl}/countries` },
    { url: `${baseUrl}/cities` },
    { url: `${baseUrl}/guides` },
    { url: `${baseUrl}/network` },
    { url: `${baseUrl}/statistics` },
    { url: `${baseUrl}/privacy` },

    { url: `${baseUrl}/terms` },

  ]);
}
