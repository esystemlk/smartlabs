'use client';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useSeasonalTheme } from './seasonal-theme-provider';

export function SeasonalLogo({ className, priority = false, area }: { className?: string; priority?: boolean; area: 'header' | 'footer' }) {
  const { active, config } = useSeasonalTheme();
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [config.branding.logo, active]);
  const seasonal = active && config.areas[area] && config.branding.enabled && !!config.branding.logo && !failed;
  return <Image src={seasonal ? config.branding.logo : '/logo.png'} alt="Smart Labs Logo" width={180} height={64} priority={priority} className={className}
    unoptimized={seasonal} onError={seasonal ? () => setFailed(true) : undefined}
    style={seasonal ? { width: 180, height: 64, objectFit: 'contain' } : { width: 'auto', height: 'auto', maxHeight: '64px' }} />;
}
