'use client';

import { useCallback, useEffect, useState } from 'react';
import { LogoBuild } from './logo-build';

/**
 * First-load intro: the Smart Labs logo builds itself (crisp vector animation, logo-build.tsx), then the page
 * assembles underneath. Once per browser session. Skipped for reduced-motion users and on very slow connections
 * / data-saver. Sets <html data-intro="playing|done"> so home.css can run the page entrance after the intro.
 */
const SEEN_KEY = 'sl-intro-seen';
const HIDE_AT_MS = 5200;   // after the logo is complete and the shine has passed

// Inline, runs while the HTML is parsed (before paint): decides whether the intro shows at all.
const DECIDE = `try{var c=navigator.connection||{},slow=c.saveData||/(^|-)2g$/.test(c.effectiveType||'');
if(sessionStorage.getItem('${SEEN_KEY}')||slow||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.dataset.introSeen='1';document.documentElement.dataset.intro='done'}
else document.documentElement.dataset.intro='playing'}catch(e){document.documentElement.dataset.intro='done'}`;

export function IntroSplash() {
  const [state, setState] = useState<'show' | 'fading' | 'gone'>('show');

  const finish = useCallback(() => {
    setState(s => (s === 'show' ? 'fading' : s));
    document.documentElement.dataset.intro = 'done';          // starts the page entrance under the fading intro
    window.setTimeout(() => setState('gone'), 900);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (root.dataset.introSeen) { root.dataset.intro = 'done'; setState('gone'); return; }
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode: show once anyway */ }
    document.body.style.overflow = 'hidden';
    const done = window.setTimeout(finish, HIDE_AT_MS);
    return () => { window.clearTimeout(done); document.body.style.overflow = ''; };
  }, [finish]);

  useEffect(() => { if (state === 'gone') document.body.style.overflow = ''; }, [state]);

  if (state === 'gone') return null;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: DECIDE }} />
      <div id="sl-intro" className={state === 'fading' ? 'out' : ''} aria-hidden={state === 'fading'}>
        <LogoBuild />
        <button type="button" className="skip" onClick={finish}>Skip</button>
      </div>
    </>
  );
}
