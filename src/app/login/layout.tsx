import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Log In",
  description: "Log in to your Smart Labs account to continue your PTE and IELTS practice.",
  alternates: { canonical: '/login' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
