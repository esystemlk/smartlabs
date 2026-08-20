import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Corporate English & PTE Training in Sri Lanka',
  description: 'Smart Labs delivers corporate English and PTE Academic training for teams and institutions across Sri Lanka — tailored programmes, expert trainers and measurable results.',
  path: '/corporate-training',
  keywords: ['corporate English training Sri Lanka', 'corporate PTE training', 'business English classes Sri Lanka'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
