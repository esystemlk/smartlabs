import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

// Public, indexable marketing/practice routes. Dashboard, admin, auth and
// payment routes are intentionally excluded (see robots.ts).
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/pte-registration', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/feedback-club', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/mock-tests', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/level-test', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/corporate-training', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/workshops', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/webinar', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/videos', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/apps', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/download', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/policies', priority: 0.3, changeFrequency: 'yearly' },
  // AI practice trainers
  { path: '/ai-essay-practice', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/swt-trainer', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/ai-sst-practice', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/ai-wfd-practice', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/ai-ielts-essay-practice', priority: 0.7, changeFrequency: 'monthly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map(r => ({
    url: `${SITE.url}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
}
