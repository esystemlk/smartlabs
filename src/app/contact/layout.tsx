import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Contact Smart Labs — PTE Classes in Nugegoda, Sri Lanka',
  description: 'Contact Smart Labs for PTE Academic, IELTS, KET & PET classes in Sri Lanka. Call 077 453 3233 or visit our Nugegoda centre (19/3 Poorwarama Rd), or join online.',
  path: '/contact',
  keywords: ['PTE class Nugegoda', 'PTE institute Nugegoda', 'PTE institute contact Sri Lanka', 'Smart Labs contact'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
