import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "PTE Summarize Spoken Text Practice with AI",
  description: "Practise PTE Summarize Spoken Text with real-style lectures and get an instant AI score for content, form, grammar, vocabulary and spelling.",
  alternates: { canonical: '/ai-sst-practice' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
