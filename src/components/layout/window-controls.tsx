'use client';

import { useState, useEffect } from 'react';
import { Minus, Square, X } from 'lucide-react';
import { cn } from '@/lib/utils';

// Define the API structure exposed by preload.js for type safety
declare global {
  interface Window {
    electronAPI: {
      minimize: () => void;
      maximize: () => void;
      close: () => void;
    };
  }
}

/**
 * A component that renders a custom title bar with window controls
 * (minimize, maximize, close) only when the application is running 
 * within an Electron environment on Windows/Linux.
 */
export function WindowControls() {
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

  // Do not render anything if not in Electron or if on macOS
  if (!isElectron || isMac) {
    return null;
  }

  const handleMinimize = () => window.electronAPI.minimize();
  const handleMaximize = () => window.electronAPI.maximize();
  const handleClose = () => window.electronAPI.close();

  const controlButtonClasses = "p-2 rounded-md hover:bg-black/10 transition-colors duration-150 flex items-center justify-center h-8 w-11 text-foreground";

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-8 bg-background/80 backdrop-blur-lg border-b border-border/50 z-[100] flex justify-end"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      <div className="flex" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <button onClick={handleMinimize} className={controlButtonClasses} title="Minimize">
          <Minus size={14} />
        </button>
        <button onClick={handleMaximize} className={controlButtonClasses} title="Maximize">
          <Square size={12} />
        </button>
        <button onClick={handleClose} className={cn(controlButtonClasses, "hover:bg-red-500 hover:text-white")} title="Close">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
