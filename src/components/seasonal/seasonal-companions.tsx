'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { charactersFor, themeLabel } from '@/lib/seasonal-theme/config';
import { useSeasonalTheme } from './seasonal-theme-provider';

export type CharacterPlacement = 'homeIntro' | 'homeCourses' | 'homeSupport' | 'pageIntro' | 'pageEnd' | 'footer';
const scenes = {
  homeIntro: { ids: ['ghost', 'wizard-owl', 'book-bat'], title: 'A little magic. A brighter future.', body: 'Your learning companions are here for the Halloween season.' },
  homeCourses: { ids: ['witch-cat', 'witch-fox'], title: 'Find your next chapter', body: 'Choose the learning path that takes you closer to your goals.' },
  homeSupport: { ids: ['pumpkin-robot', 'mummy-bunny'], title: 'Big questions, friendly guidance', body: 'We are here to help you take your next step with confidence.' },
};

export function SeasonalCompanions({ placement }: { placement: CharacterPlacement }) {
  const { active, config, paused } = useSeasonalTheme();
  const pathname = usePathname();
  const halloweenCharacters = charactersFor(config.id);
  const ref = useRef<HTMLDivElement>(null);
  const [onscreen, setOnscreen] = useState(true);
  const eligible = active && config.areas.characters && config.characterPlacements[placement]
    && (!(placement === 'pageIntro' || placement === 'pageEnd') || pathname !== '/')
    && (placement !== 'footer' || config.areas.footer);
  useEffect(() => {
    if (!eligible || !ref.current) return;
    const observer = new IntersectionObserver(([entry]) => setOnscreen(entry.isIntersecting));
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [eligible]);
  if (!eligible) return null;
  const scene = placement in scenes ? scenes[placement as keyof typeof scenes] : null;
  const offset = [...pathname].reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % halloweenCharacters.length;
  const cast = placement === 'footer' ? [...halloweenCharacters]
    : scene ? scene.ids.map(id => halloweenCharacters.find(character => character.id === id)!)
      : [halloweenCharacters[(offset + (placement === 'pageEnd' ? 3 : 0)) % halloweenCharacters.length], halloweenCharacters[(offset + (placement === 'pageEnd' ? 4 : 1)) % halloweenCharacters.length]];
  return <div ref={ref} data-seasonal-placement={placement} aria-hidden="true"
    className={`seasonal-companions seasonal-companions-${placement} ${paused || !onscreen || !config.areas.animations ? 'seasonal-static' : ''} ${config.characterPlacements.mobile ? '' : 'seasonal-companions-desktop'}`}>
    <div className="seasonal-companions-inner">
      {scene && <div className="seasonal-companions-copy"><span className="seasonal-eyebrow">{themeLabel(config.id)} at Smart Labs</span><p className="seasonal-companions-title">{config.id === 'christmas' && placement === 'homeIntro' ? 'Bright minds. A season of possibility.' : scene.title}</p><p>{placement === 'homeIntro' ? `Your learning companions are here for the ${themeLabel(config.id)} season.` : scene.body}</p></div>}
      <div className="seasonal-companions-cast">{cast.map((character, index) => <img key={character.id} src={character.src} alt="" width={640} height={585} loading="lazy" decoding="async"
        style={{ animationDelay: `${index * -.8}s` }} onError={event => { event.currentTarget.style.visibility = 'hidden'; }} />)}</div>
    </div>
  </div>;
}
