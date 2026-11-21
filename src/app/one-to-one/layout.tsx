import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'One-to-One PTE & IELTS Sessions',
  description: 'Book a private 1–3 hour PTE or IELTS session with a SmartLabs lecturer, online on Zoom or in person. Choose your lecturer and an open time slot.',
  alternates: { canonical: '/one-to-one' },
};

export default function OneToOneLayout({ children }: { children: React.ReactNode }) {
  return children;
}
