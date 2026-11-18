import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Free Personalised PTE Study Plan",
  description: "Generate a free personalised PTE study plan based on your target score, test date and available study time.",
  alternates: { canonical: '/study-plan' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
