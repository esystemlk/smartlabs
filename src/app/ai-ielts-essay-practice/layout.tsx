import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AI IELTS Writing Task 2 Scoring",
  description: "Practise IELTS Writing Task 2 and get an AI band score on the four official criteria, with clear feedback on how to reach your target band.",
  alternates: { canonical: '/ai-ielts-essay-practice' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
