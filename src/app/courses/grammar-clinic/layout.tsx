import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Grammar Clinic — Build Your English Foundation",
  description: "Fix the grammar mistakes holding back your PTE and IELTS scores with the Smart Labs Grammar Clinic, a focused foundation course.",
  alternates: { canonical: '/courses/grammar-clinic' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
