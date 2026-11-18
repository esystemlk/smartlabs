import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "PTE Essay Topics & Predictions 2026",
  description: "Free list of likely PTE Academic essay topics and predictions for 2026, grouped by theme, to practise before your exam.",
  alternates: { canonical: '/resources/essay-topics-2026' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
