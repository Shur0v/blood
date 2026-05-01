import { MetadataRoute } from 'next';
import { getPublicBaseUrl } from '@/src/backend/config/env';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getPublicBaseUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin-dashboard',
          '/dashboard',
          '/api',
          '/login',
          '/register',
          '/user',
          '/account',
          '/settings',
          '/private',
          '/checkout',
          '/payment',
          '/success',
          '/failed',
          '/trash',
          '/backup',
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap-index.xml`,
      `${baseUrl}/sitemap-main.xml`,
      `${baseUrl}/sitemap-categories.xml`,
      `${baseUrl}/sitemap-regions.xml`,
      `${baseUrl}/sitemap-blog.xml`,
      `${baseUrl}/sitemap-location.xml`,
      `${baseUrl}/sitemap-keywords-1.xml`,
      `${baseUrl}/sitemap-keywords-2.xml`,
      `${baseUrl}/sitemap-keywords-3.xml`,
      `${baseUrl}/sitemap-keywords-4.xml`,
    ],
  };
}
