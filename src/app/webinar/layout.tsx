import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "PTE Reading Strategy Webinar",
  description: "Join the free Smart Labs PTE Reading strategy webinar and learn proven techniques to raise your reading score.",
  alternates: { canonical: '/webinar' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
