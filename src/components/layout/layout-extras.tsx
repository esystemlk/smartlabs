'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { SITE_STATUS_PATH, DEV_CONSOLE_PATH } from '@/lib/site-mode';

// Non-critical global widgets, split into their own chunks and mounted only
// after the browser goes idle — keeps them out of first-load hydration
// (big mobile Lighthouse TBT win) without changing behaviour.
const MouseSpotlight = dynamic(() => import('@/components/ui/mouse-spotlight').then(m => m.MouseSpotlight), { ssr: false });
const AccessibilityWidget = dynamic(() => import('@/components/accessibility/accessibility-widget').then(m => m.AccessibilityWidget), { ssr: false });
const CommandPalette = dynamic(() => import('@/components/layout/command-palette').then(m => m.CommandPalette), { ssr: false });
const WebinarBanner = dynamic(() => import('@/components/webinar/webinar-banner').then(m => m.WebinarBanner), { ssr: false });
const WorkshopPopup = dynamic(() => import('@/components/events/workshop-popup').then(m => m.WorkshopPopup), { ssr: false });

// Marketing overlays wait 12s or the first interaction — whichever comes
// first. Popping up while the page is still painting both annoys readers and
// registers as the page's LCP in Lighthouse.
export function useDelayedPopups(delayMs = 12000) {
  const [popupsReady, setPopupsReady] = useState(false);

  useEffect(() => {
    const show = () => setPopupsReady(true);
    const t = setTimeout(show, delayMs);
    const opts = { once: true, passive: true } as AddEventListenerOptions;
    window.addEventListener('pointerdown', show, opts);
    window.addEventListener('keydown', show, opts);
    window.addEventListener('scroll', show, opts);
    return () => {
      clearTimeout(t);
      window.removeEventListener('pointerdown', show);
      window.removeEventListener('keydown', show);
      window.removeEventListener('scroll', show);
    };
  }, [delayMs]);

  return popupsReady;
}

export function LayoutExtras() {
  const [ready, setReady] = useState(false);
  const popupsReady = useDelayedPopups();
  const pathname = usePathname();

  useEffect(() => {
    const start = () => setReady(true);
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(start, { timeout: 3000 });
      return () => window.cancelIdleCallback(id);
    }
    const t = setTimeout(start, 1500);
    return () => clearTimeout(t);
  }, []);

  // No site chrome while the site is switched off, or in the dev console.
  if (pathname === SITE_STATUS_PATH || pathname?.startsWith(DEV_CONSOLE_PATH)) return null;
  if (!ready) return null;

  return (
    <>
      <MouseSpotlight />
      <AccessibilityWidget />
      <CommandPalette />
      {popupsReady && (
        <>
          <WebinarBanner />
          <WorkshopPopup />
        </>
      )}
    </>
  );
}
