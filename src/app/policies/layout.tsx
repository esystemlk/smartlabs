import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Privacy Policy & Terms",
  description: "Read the Smart Labs privacy policy, terms of service, payment and refund policies.",
  alternates: { canonical: '/policies' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
