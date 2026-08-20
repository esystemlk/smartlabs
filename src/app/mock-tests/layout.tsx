import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'PTE Mock Tests with AI Scoring — Sri Lanka',
  description: 'Sit full-length PTE Academic mock tests marked by AI at Smart Labs. Realistic timing, instant band scores and detailed feedback for Speaking, Writing, Reading & Listening.',
  path: '/mock-tests',
  keywords: ['PTE mock test', 'PTE mock test Sri Lanka', 'free PTE mock test', 'PTE practice test online', 'PTE AI scoring'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
