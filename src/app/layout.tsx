import type { Metadata } from 'next';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { FirebaseClientProvider } from '@/firebase';
import './globals.css';
import { CookieBanner } from '@/components/cookie-banner';
import { LayoutManager } from '@/components/layout/layout-manager';
import { WindowControls } from '@/components/layout/window-controls';
import { AccessibilityWidget } from '@/components/accessibility/accessibility-widget';
import { CommandPalette } from '@/components/layout/command-palette';

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: {
    default: 'Smart Labs - AI-Powered English Exam Prep for PTE, IELTS & More',
    template: '%s | Smart Labs',
  },
  description:
    'Achieve your target score with Smart Labs. We offer expert-led courses for PTE, IELTS, and CELPIP, featuring AI-powered practice tests and personalized feedback.',
  manifest: '/manifest.json',
  openGraph: {
    title: 'Smart Labs | AI-Powered English Exam Prep',
    description: 'Join thousands of successful students who achieved their dream scores with our AI-powered learning platform and expert instructors.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    siteName: 'Smart Labs',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smart Labs | AI-Powered English Exam Prep',
    description: 'Achieve your dream score in PTE, IELTS, and CELPIP with AI-powered practice and expert guidance.',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#4f46e5" />
      </head>
      <body
        className={cn(
          'min-h-screen font-sans antialiased',
          'flex flex-col'
        )}
      >
        <FirebaseClientProvider>
          <WindowControls />
          <AccessibilityWidget />
          <CommandPalette />
          <LayoutManager />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
          <CookieBanner />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
