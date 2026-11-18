import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Help Center & Support",
  description: "Get help with Smart Labs courses, payments, AI practice and your account, or contact our support team.",
  alternates: { canonical: '/support' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
