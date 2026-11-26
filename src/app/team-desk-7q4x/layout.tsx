import type { Metadata } from 'next';

// Private coordinator workspace: reachable only by its link, never indexed.
export const metadata: Metadata = {
  title: 'Team desk',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
