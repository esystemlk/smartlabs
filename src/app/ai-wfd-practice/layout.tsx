import type { Metadata } from 'next';
import { brandFontClass } from '@/lib/brand-fonts';

export const metadata: Metadata = {
  title: "PTE Write From Dictation Practice",
  description: "Practise PTE Write From Dictation with natural audio and instant word-by-word marking to sharpen your listening and spelling.",
  alternates: { canonical: '/ai-wfd-practice' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <div className={brandFontClass}>{children}</div>;
}
