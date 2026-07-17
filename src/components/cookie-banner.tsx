
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Cookie } from 'lucide-react';
import Link from 'next/link';
import { SITE_STATUS_PATH, DEV_CONSOLE_PATH } from '@/lib/site-mode';

export function CookieBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const pathname = usePathname();
  // Never show site chrome on the status page — while the site is switched
  // off it must look like nothing is there.
  const hidden = pathname === SITE_STATUS_PATH || pathname?.startsWith(DEV_CONSOLE_PATH);

  useEffect(() => {
    // We need to check if we are on the client side before accessing localStorage
    if (typeof window !== 'undefined') {
      const cookieConsent = localStorage.getItem('cookie_consent');
      if (cookieConsent !== 'true') {
        setIsVisible(true);
      }
    }
  }, []);

  const acceptCookies = () => {
    setIsVisible(false);
    localStorage.setItem('cookie_consent', 'true');
  };

  if (!isVisible || hidden) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/80 backdrop-blur-md border-t">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs sm:text-sm text-foreground">
          <Cookie className="h-5 w-5 flex-shrink-0" />
          <p>
            We use cookies to improve your experience.
            <Link href="/policies" className="underline ml-1 hover:text-primary">Learn more</Link>.
          </p>
        </div>
        <Button onClick={acceptCookies} className="flex-shrink-0">Accept</Button>
      </div>
    </div>
  );
}
