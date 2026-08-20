import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';

export const metadata: Metadata = pageMeta({
  title: 'Contact Smart Labs — PTE Classes in Rajagiriya & Wattala',
  description: 'Contact Smart Labs for PTE Academic, IELTS, KET & PET classes in Sri Lanka. Call 077 453 3233 or visit our Rajagiriya and Wattala centres, or join online.',
  path: '/contact',
  keywords: ['PTE class Rajagiriya', 'PTE class Wattala', 'PTE institute contact Sri Lanka', 'Smart Labs contact'],
});

export default function SeoLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
