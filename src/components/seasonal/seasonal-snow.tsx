'use client';
import type { CSSProperties } from 'react';
import { usePathname } from 'next/navigation';
import { useSeasonalTheme } from './seasonal-theme-provider';

export function SeasonalSnow({ hero = false }: { hero?: boolean }) {
  const { active, config, paused } = useSeasonalTheme();
  const pathname = usePathname();
  if (!active || config.id !== 'christmas' || !config.areas.animations) return null;
  const snow = config.effects.snow && (hero ? config.effects.snowScope === 'hero' : config.effects.snowScope === 'site' || (config.effects.snowScope === 'home' && pathname === '/'));
  const sleigh = hero && config.effects.sleigh;
  if (!snow && !sleigh) return null;
  return <div aria-hidden="true" className={`seasonal-snow ${hero ? 'seasonal-snow-hero' : 'seasonal-snow-screen'} ${paused ? 'seasonal-static' : ''} ${config.effects.mobile ? '' : 'seasonal-effect-desktop'}`}>
    {snow && Array.from({ length: config.motion === 'medium' ? 24 : 12 }, (_, i) => <i key={i} className="seasonal-snowflake" style={{ '--snow-x': `${(i * 37 + 9) % 100}%`, '--snow-size': `${3 + i % 4}px`, '--snow-time': `${13 + i % 9}s`, '--snow-delay': `${-i * 2 - 3}s`, '--snow-drift': `${i % 2 ? -35 : 45}px` } as CSSProperties} />)}
    {sleigh && <div className="seasonal-sleigh"><svg viewBox="0 0 200 80" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" focusable="false"><path d="M15 47Q24 60 55 56L75 35L90 45L85 64H26Q15 64 12 58M20 72H90Q100 72 103 63M30 47V32H49V49M33 31V20H48V31M30 26H51M40 19V46M92 43L123 30M124 32L141 34L151 20L168 24L176 13M146 34L145 55M159 30L170 48M168 23L174 34L184 35M175 14L170 5M175 14L185 7M174 12L184 14" /></svg></div>}
  </div>;
}
