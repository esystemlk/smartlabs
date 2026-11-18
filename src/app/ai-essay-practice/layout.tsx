import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AI PTE Essay Scoring & Practice",
  description: "Write a PTE Academic essay and get an instant AI score on all seven criteria, with corrections, vocabulary upgrades and a model essay.",
  alternates: { canonical: '/ai-essay-practice' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
