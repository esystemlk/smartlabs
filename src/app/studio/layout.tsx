import type { Metadata } from 'next';
import { IBM_Plex_Sans, Newsreader } from 'next/font/google';
import './studio.css';

const sans = IBM_Plex_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-studio-sans', display: 'swap' });
const serif = Newsreader({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-studio-serif', display: 'swap' });

export const metadata: Metadata = {
  // absolute: don't inherit the Smart Labs "| Smart Labs" title template.
  title: { absolute: 'IELTS Studio', template: '%s · IELTS Studio' },
  description: 'IELTS Listening, Reading and Writing practice and full mock tests, by Smart Labs.',
  // Not indexed until IELTS Studio launches on its own domain.
  robots: { index: false, follow: false },
  icons: { icon: '/studio/logo.png' },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return <div className={`studio-app ${sans.variable} ${serif.variable}`}>{children}</div>;
}
