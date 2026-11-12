import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import './studio.css';

// Studio fonts load in the browser, not at build time: a failed Google Fonts download
// during `next build` (next/font) broke a Studio deploy, and both Vercel projects build
// this file. If the stylesheet can't load, the CSS falls back to Georgia / system fonts.
const FONTS_CSS = 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=Newsreader:opsz,wght@6..72,400;6..72,500&display=swap';
const fontVars = { '--font-studio-sans': '"IBM Plex Sans"', '--font-studio-serif': '"Newsreader"' } as CSSProperties;

export const metadata: Metadata = {
  // absolute: don't inherit the Smart Labs "| Smart Labs" title template.
  title: { absolute: 'IELTS Studio', template: '%s · IELTS Studio' },
  description: 'IELTS Listening, Reading and Writing practice and full mock tests, by Smart Labs.',
  // Not indexed until IELTS Studio launches on its own domain.
  robots: { index: false, follow: false },
  icons: { icon: '/studio/logo.png' },
};

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="studio-app" style={fontVars}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={FONTS_CSS} />
      {children}
    </div>
  );
}
