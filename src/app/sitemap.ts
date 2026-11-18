import type { MetadataRoute } from 'next';
import { SITE } from '@/lib/seo';

// Public, indexable marketing/practice routes. Dashboard, admin, auth and
// payment routes are intentionally excluded (see robots.ts).
const ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'weekly' },
  { path: '/guide', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/pte-registration', priority: 0.95, changeFrequency: 'weekly' },
  { path: '/courses', priority: 0.9, changeFrequency: 'weekly' },
  { path: '/courses/grammar-clinic', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/ielts-registration', priority: 0.85, changeFrequency: 'weekly' },
  { path: '/pte-exam-guide', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/study-plan', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/credits', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/partners', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.4, changeFrequency: 'monthly' },
  { path: '/feedback-club', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/mock-tests', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/level-test', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/corporate-training', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/blog', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/resources', priority: 0.7, changeFrequency: 'weekly' },
  { path: '/resources/essay-topics-2026', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/workshops', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/webinar', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/videos', priority: 0.6, changeFrequency: 'weekly' },
  { path: '/apps', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/download/windows', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
  { path: '/policies', priority: 0.3, changeFrequency: 'yearly' },
  // AI practice trainers
  { path: '/ai-essay-practice', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/swt-trainer', priority: 0.75, changeFrequency: 'monthly' },
  { path: '/ai-sst-practice', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/ai-wfd-practice', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/ai-ielts-essay-practice', priority: 0.7, changeFrequency: 'monthly' },
];

// Blog posts load in the browser, so list them here or search engines can't find them.
async function blogPosts(): Promise<MetadataRoute.Sitemap> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) return [];
    const snap = await adminDb.collection('blog_posts').select('slug', 'publishDate').get();
    return snap.docs.map(d => d.data()).filter(p => typeof p.slug === 'string' && p.slug).map(p => ({
      url: `${SITE.url}/blog/${encodeURIComponent(p.slug)}`,
      lastModified: p.publishDate?.toDate?.() ?? (p.publishDate ? new Date(p.publishDate) : undefined),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch {
    return []; // never fail the sitemap because of the blog
  }
}

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const fixed = ROUTES.map(r => ({
    url: `${SITE.url}${r.path === '/' ? '' : r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));
  return [...fixed, ...(await blogPosts())];
}
