import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Free PTE Workshops in Sri Lanka',
  description: 'Join Smart Labs’ free monthly PTE workshops in Sri Lanka — learn exam strategy, question types and scoring from expert trainers, online and in person.',
  path: '/workshops',
  keywords: ['free PTE workshop', 'PTE workshop Sri Lanka', 'PTE seminar', 'PTE strategy session'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
