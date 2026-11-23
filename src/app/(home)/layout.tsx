import type { Metadata } from 'next';

// The home page is a client component, so its canonical lives here.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
