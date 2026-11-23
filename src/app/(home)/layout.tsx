import type { Metadata } from 'next';
import { Bricolage_Grotesque, Instrument_Serif, Space_Grotesk, Syne, Unbounded, JetBrains_Mono } from 'next/font/google';
import './home.css';

// Section fonts load on the homepage only (self-hosted by next/font).
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-bricolage', display: 'swap' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument', display: 'swap' });
const space = Space_Grotesk({ subsets: ['latin'], weight: ['500', '700'], variable: '--font-space', display: 'swap' });
const syne = Syne({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-syne', display: 'swap' });
const unbounded = Unbounded({ subsets: ['latin'], weight: ['700'], variable: '--font-unbounded', display: 'swap' });
const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['500'], variable: '--font-jetbrains', display: 'swap' });

// The home page is a client component, so its canonical lives here.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={[bricolage.variable, instrument.variable, space.variable, syne.variable, unbounded.variable, jetbrains.variable].join(' ')}>
      {children}
    </div>
  );
}
