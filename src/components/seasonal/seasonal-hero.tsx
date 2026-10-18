'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useSeasonalTheme } from './seasonal-theme-provider';
import { SeasonalFlight } from './seasonal-flight';

export function SeasonalHero() {
  const { config, active, paused } = useSeasonalTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const [onscreen, setOnscreen] = useState(true);
  useEffect(() => {
    const element = sectionRef.current;
    if (!element || !active || !config.areas.hero) return;
    const observer = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting));
    observer.observe(element);
    return () => observer.disconnect();
  }, [active, config.areas.hero]);
  if (!active || !config.areas.hero) return null;
  return <section ref={sectionRef} className={`seasonal-hero ${config.effects.heroMotion && config.areas.animations ? 'seasonal-hero-animated' : ''} ${config.effects.mobile ? '' : 'seasonal-hero-desktop-motion'} ${paused || !onscreen || !config.areas.animations ? 'seasonal-static' : ''}`} aria-label="Smart Labs Halloween season">
    {config.media.hero && <picture className="seasonal-hero-picture">
      {config.media.mobileHero && <source media="(max-width: 767px)" srcSet={config.media.mobileHero} />}
      <img src={config.media.hero} alt="" fetchPriority="high" onError={e => { e.currentTarget.style.visibility = 'hidden'; }} />
    </picture>}
    <div className="seasonal-hero-shade" style={{ background: `linear-gradient(90deg, rgba(22,15,36,${Math.min(.95, Math.max(.72, config.hero.overlay + .08))}) 0%, rgba(22,15,36,${Math.max(.65, config.hero.overlay)}) 65%, rgba(22,15,36,0.25) 100%)` }} />
    {config.effects.heroMotion && config.areas.animations && <div className="seasonal-hero-atmosphere" aria-hidden="true"><i /><i /><i /><i /><i /></div>}
    <SeasonalFlight hero />
    <div className="seasonal-hero-copy">
      <p className="seasonal-eyebrow">Halloween at Smart Labs</p>
      <h1>{config.hero.title.split('\n').map((line, index) => <span key={index} className={index === 0 ? 'seasonal-hero-first-line' : undefined}>{index > 0 && <br />}{line}</span>)}</h1>
      <p className="seasonal-hero-greeting">{config.hero.greeting}</p>
      <p>{config.hero.body}</p>
      <div className="flex flex-wrap gap-3 mt-8"><Link className="seasonal-cta" href={config.hero.primaryHref}>{config.hero.primaryLabel}</Link><Link className="seasonal-cta seasonal-cta-outline" href={config.hero.secondaryHref}>{config.hero.secondaryLabel}</Link></div>
      <p className="seasonal-hero-note">Expert guidance · Smart practice · Your next chapter</p>
    </div>
    {config.areas.characters && config.media.character && <img src={config.media.character} alt="" width={config.hero.characterSize} height={config.hero.characterSize} className={`seasonal-hero-character seasonal-motion-${config.motion} seasonal-character-${config.hero.characterPosition}`} style={{ width: config.hero.characterSize }} onError={e => { e.currentTarget.style.display = 'none'; }} />}
  </section>;
}
