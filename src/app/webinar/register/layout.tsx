import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Register for the Free PTE Webinar",
  description: "Reserve your free seat in the Smart Labs PTE strategy webinar.",
  alternates: { canonical: '/webinar/register' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
