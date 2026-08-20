import type { Metadata } from 'next';
import { pageMeta, courseJsonLd } from '@/lib/seo';
import { PTE_PACKAGES } from '@/lib/pte-packages';

export const metadata: Metadata = pageMeta({
  title: 'PTE Academic Courses & Registration in Sri Lanka',
  description:
    'Register for Smart Labs PTE Boostify courses — from LKR 35,000, 28+ hours of guided learning with expert trainers, AI practice and mock tests. Online plus our Nugegoda centre.',
  path: '/pte-registration',
  keywords: [
    'PTE course registration', 'PTE Boostify', 'PTE Boostify Plus', 'PTE Boostify Pro',
    'PTE course fees Sri Lanka', 'enroll PTE class Sri Lanka', 'PTE intensive course Sri Lanka',
  ],
});

const courses = PTE_PACKAGES.map(p => ({ name: p.name, description: p.tagline, price: p.price, url: '/pte-registration' }));

export default function PteRegistrationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseJsonLd(courses)) }} />
      {children}
    </>
  );
}
