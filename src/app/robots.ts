import { MetadataRoute } from 'next';
import { getPublicBaseUrl } from '@/src/backend/config/env';
import { PRIVATE_CRAWL_PATHS, SEARCH_CRAWLERS } from '@/src/lib/crawlerPolicy';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicBaseUrl();
  return {
    rules: ['*', ...SEARCH_CRAWLERS].map(userAgent => ({ userAgent, allow: '/', disallow: PRIVATE_CRAWL_PATHS })),
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/sitemap-main.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-regions.xml`,
      `${baseUrl}/sitemap-blog.xml`,
      `${baseUrl}/blog/feed.xml`,
      `${baseUrl}/sitemap-location.xml`,
      `${baseUrl}/sitemap-guides.xml`,
      `${baseUrl}/sitemap-network.xml`,
      `${baseUrl}/sitemap-donors.xml`,
    ],
  };
}
