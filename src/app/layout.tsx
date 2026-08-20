import type { Metadata } from 'next';
import { Inter, Poppins, Playfair_Display } from 'next/font/google';
import { cn } from '@/lib/utils';

// Self-hosted via next/font — no render-blocking Google Fonts requests.
// display:'optional' prevents the late font-arrival re-paint that inflates
// LCP and CLS on slow mobile connections (fallback metrics are auto-adjusted).
const inter = Inter({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700', '800'], variable: '--font-inter', display: 'optional', preload: false });
const poppins = Poppins({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-poppins', display: 'optional', preload: false });
const playfair = Playfair_Display({ subsets: ['latin'], weight: ['600', '700'], style: ['normal', 'italic'], variable: '--font-playfair', display: 'optional', preload: false });
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { FirebaseClientProvider } from '@/firebase';
import './globals.css';
import { LayoutManager } from '@/components/layout/layout-manager';
import { WindowControls } from '@/components/layout/window-controls';
import { LayoutExtras } from '@/components/layout/layout-extras';
import { CookieBanner } from '@/components/cookie-banner';
import { BASE_KEYWORDS, orgJsonLd, websiteJsonLd, faqJsonLd, HOME_FAQS } from '@/lib/seo';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://smartlabs.lk';

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: 'Smart Labs — Best PTE Academic Classes & Training in Sri Lanka',
    template: '%s | Smart Labs',
  },
  description:
    'Smart Labs is Sri Lanka’s AI-powered PTE Academic institute — expert PTE trainers, AI-scored practice, full mock tests and PTE Boostify courses online and in Nugegoda. Also IELTS, KET & PET.',
  keywords: BASE_KEYWORDS,
  alternates: { canonical: '/' },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  openGraph: {
    type: 'website',
    url: APP_URL,
    siteName: 'Smart Labs',
    locale: 'en_LK',
    title: 'Smart Labs — Best PTE Academic Classes & Training in Sri Lanka',
    description:
      'AI-scored PTE practice, mock tests and expert PTE Boostify courses — online and in Nugegoda. Sri Lanka’s smart way to your target PTE score.',
    images: [{ url: '/logo.png' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Labs — Best PTE Academic Classes in Sri Lanka',
    description: 'AI-scored PTE practice, mock tests and expert-led courses in Sri Lanka.',
  },
  icons: { icon: '/favicon.ico' },
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#4f46e5',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(inter.variable, poppins.variable, playfair.variable)}>
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          'flex flex-col overflow-x-hidden max-w-[100vw]'
        )}
      >
        {/* Structured data — Organization + LocalBusiness, WebSite, FAQ.
            Drives Google rich results and GEO/AEO answer engines. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd()) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd(HOME_FAQS)) }} />
        <FirebaseClientProvider>
          <WindowControls />
          <LayoutManager />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
          <CookieBanner />
          <LayoutExtras />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
