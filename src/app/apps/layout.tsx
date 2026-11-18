import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Smart Labs Apps — Learn on Mobile & Desktop",
  description: "Download the Smart Labs apps and practise PTE and IELTS anytime, anywhere, on your phone, tablet or computer.",
  alternates: { canonical: '/apps' },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
