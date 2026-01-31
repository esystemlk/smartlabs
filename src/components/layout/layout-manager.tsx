'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export function LayoutManager() {
  const pathname = usePathname()
  const [isElectron, setIsElectron] = useState(false);
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    const runningInElectron = typeof window !== 'undefined' && !!window.electronAPI;
    setIsElectron(runningInElectron);
    if (runningInElectron) {
      const runningOnMac = navigator.userAgent.includes('Mac');
      setIsMac(runningOnMac);
    }
  }, []);

  useEffect(() => {
    const isSpecialLayout = pathname.startsWith('/dashboard') || pathname.startsWith('/admin') || pathname === '/login' || pathname === '/signup' || pathname === '/forgot-password' || pathname === '/welcome' || pathname.startsWith('/payment');
    
    // This component only manages the main marketing site layout.
    // Special layouts handle their own padding.
    if (isSpecialLayout) {
      document.body.classList.remove('pt-20', 'pt-28');
      return;
    }
    
    const isDesktopClient = isElectron && !isMac;

    if (isDesktopClient) {
        // h-28 is 7rem, which is h-8 (2rem) for title bar + h-20 (5rem) for header
        document.body.classList.add('pt-28');
        document.body.classList.remove('pt-20');
    } else {
        document.body.classList.add('pt-20');
        document.body.classList.remove('pt-28');
    }

  }, [pathname, isElectron, isMac]);

  return null;
}
