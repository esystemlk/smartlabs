import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "AI Practice Credits & Plans",
  description: "Buy Smart Labs AI practice credits and plans for PTE and IELTS scoring: essays, summaries, speaking and full mock tests.",
  alternates: { canonical: '/credits' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
