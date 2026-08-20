import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Free PTE Level Test — Check Your Target Band',
  description: 'Take Smart Labs’ free PTE level test to find your current band and get a personalised study plan. The smart first step for PTE learners in Sri Lanka.',
  path: '/level-test',
  keywords: ['free PTE level test', 'PTE level check', 'PTE assessment Sri Lanka', 'PTE diagnostic test'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
