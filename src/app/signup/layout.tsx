import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Create a Free Account",
  description: "Create a free Smart Labs account to start PTE and IELTS practice with AI scoring.",
  alternates: { canonical: '/signup' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
