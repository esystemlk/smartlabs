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
import { MouseSpotlight } from '@/components/ui/mouse-spotlight';
import { WebinarBanner } from '@/components/webinar/webinar-banner';
import { AdvancedFloatingAI } from '@/components/ui/advanced-floating-ai';
import { WorkshopPopup } from '@/components/events/workshop-popup';

// ... (Metadata code remains the same)

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
          <MouseSpotlight />
          <WindowControls />
          <AccessibilityWidget />
          <CommandPalette />
          <LayoutManager />
          <WebinarBanner />
          <WorkshopPopup />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
          <Toaster />
          <CookieBanner />
          <AdvancedFloatingAI />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
