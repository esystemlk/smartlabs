import type { Metadata } from 'next';
import { brandFontClass } from '@/lib/brand-fonts';

export const metadata: Metadata = {
  title: "PTE Summarize Written Text Trainer",
  description: "Practise PTE Summarize Written Text and get an instant AI score for content, form, grammar and vocabulary, with teaching feedback.",
  alternates: { canonical: '/swt-trainer' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={brandFontClass}>{children}</div>;
}
