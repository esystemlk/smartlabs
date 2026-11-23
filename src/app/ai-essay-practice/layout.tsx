import type { Metadata } from 'next';
import { brandFontClass } from '@/lib/brand-fonts';
import './essay-theme.css';

export const metadata: Metadata = {
  title: "AI PTE Essay Scoring & Practice",
  description: "Write a PTE Academic essay and get an instant AI score on all seven criteria, with corrections, vocabulary upgrades and a model essay.",
  alternates: { canonical: '/ai-essay-practice' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  // pte-essay-theme: brand colours via essay-theme.css; the page logic is untouched.
  return <div className={`pte-essay-theme ${brandFontClass}`}>{children}</div>;
}
