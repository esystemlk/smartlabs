import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Free PTE Resources, Templates & Practice Materials',
  description: 'Free PTE Academic resources from Smart Labs — templates, strategies, essay topics and practice materials to boost your PTE score.',
  path: '/resources',
  keywords: ['free PTE resources', 'PTE templates', 'PTE essay topics', 'PTE practice materials', 'PTE study material Sri Lanka'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
