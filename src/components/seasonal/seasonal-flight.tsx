'use client';

import type { CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { useSeasonalTheme } from './seasonal-theme-provider';

/** Small original vector silhouettes: no downloads, timers or pointer handlers. */
export function SeasonalFlight({ hero = false }: { hero?: boolean }) {
  const { active, config, paused } = useSeasonalTheme();
  const pathname = usePathname();
  const { effects } = config;
  if (!active || !config.areas.animations || !effects.bats) return null;
  if (hero ? effects.batScope !== 'hero' : effects.batScope === 'hero' || (effects.batScope === 'home' && pathname !== '/')) return null;
  const count = config.motion === 'medium' ? 6 : 3;
  return <div aria-hidden="true" className={`seasonal-flight ${hero ? 'seasonal-flight-hero' : 'seasonal-flight-screen'} ${paused ? 'seasonal-static' : ''} ${effects.mobile ? '' : 'seasonal-effect-desktop'}`}>
    {Array.from({ length: count }, (_, i) => <div key={i} className={`seasonal-flying-bat ${i % 2 ? 'seasonal-bat-reverse' : ''}`} style={{ '--bat-y': `${12 + (i * 17) % 65}%`, '--bat-duration': `${(config.motion === 'medium' ? 16 : 25) + i * 3}s`, '--bat-delay': `${-i * 7 - 4}s`, '--bat-size': `${28 + (i % 3) * 9}px` } as CSSProperties}>
      <svg viewBox="0 0 100 50" fill="currentColor" focusable="false">
        <g className="seasonal-bat-wing seasonal-bat-wing-left"><path d="M48 26Q28 1 2 8Q10 17 8 28Q20 20 24 36Q35 25 48 33Z" /></g>
        <g className="seasonal-bat-wing seasonal-bat-wing-right"><path d="M52 26Q72 1 98 8Q90 17 92 28Q80 20 76 36Q65 25 52 33Z" /></g>
        <path d="M43 17L42 7L49 14H51L58 7L57 17Q65 32 50 44Q35 32 43 17Z" />
      </svg>
    </div>)}
  </div>;
}
