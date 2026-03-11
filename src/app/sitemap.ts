import { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const staticPages = [
    '/',
    '/about',
    '/pte',
    '/ielts',
    '/celpip',
    '/corporate-training',
    '/contact',
    '/blog',
    '/apps',
    '/policies',
    '/login',
    '/signup',
    '/enroll/pte-boostify',
    '/enroll/pte-boostify-grammar',
    '/enroll/pte-hybrid',
    '/enroll/pte-physical',
    '/enroll/pte-recorded',
    '/enroll/ielts-boostify',
    '/enroll/ielts-mastery',
    '/enroll/ielts-hybrid',
    '/enroll/ielts-physical',
  ];

  const sitemapEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${baseUrl}${page}`,
    lastModified: new Date(),
    changeFrequency: page === '/' ? 'daily' : 'weekly',
    priority: page === '/' ? 1 : 0.8,
  }));
 
  // Here you could dynamically fetch blog posts, etc.
  // For now, this static sitemap is a great improvement.

  return sitemapEntries;
}
