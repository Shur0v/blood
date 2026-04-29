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
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
