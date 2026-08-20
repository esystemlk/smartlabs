import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'PTE Tips, Strategies & Exam Guides — Smart Labs Blog',
  description: 'PTE Academic tips, strategies, templates and exam guides from Smart Labs’ trainers — everything you need to reach your target PTE score in Sri Lanka.',
  path: '/blog',
  keywords: ['PTE tips', 'PTE strategies', 'PTE exam guide', 'how to improve PTE score', 'PTE blog Sri Lanka'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
