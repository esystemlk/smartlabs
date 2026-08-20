import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin', '/api/', '/dashboard', '/login', '/signup', '/forgot-password',
          '/payment', '/payment-success', '/payment-cancel', '/smreg', '/welcome',
          '/site-status', '/sl-console-9f3k2x', '/my-purchases', '/enroll',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
