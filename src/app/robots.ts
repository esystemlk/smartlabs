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
          // Private console/registration paths are not listed here (that advertised them); they send X-Robots-Tag: noindex instead.
          '/payment', '/payment-success', '/payment-cancel', '/welcome',
          '/my-purchases', '/enroll',
        ],
      },
    ],
    sitemap: `${SITE.url}/sitemap.xml`,
    host: SITE.url,
  };
}
