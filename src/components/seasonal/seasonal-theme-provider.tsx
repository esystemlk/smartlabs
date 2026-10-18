'use client';

import React, { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { defaultTheme, eligibleRoute, resolveTheme, themeSchema, type SeasonalTheme } from '@/lib/seasonal-theme/config';

type ThemeState = { config: SeasonalTheme; active: boolean; paused: boolean; preview: boolean };
const ThemeContext = createContext<ThemeState>({ config: defaultTheme, active: false, paused: false, preview: false });
export const useSeasonalTheme = () => useContext(ThemeContext);
const preference = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const remember = (key: string, value: string) => { try { localStorage.setItem(key, value); } catch { /* Storage can be disabled. */ } };
function hsl(hex: string) {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), delta = max - min, l = (max + min) / 2;
  let h = 0;
  if (delta) h = max === r ? ((g - b) / delta) % 6 : max === g ? (b - r) / delta + 2 : (r - g) / delta + 4;
  const s = delta ? delta / (1 - Math.abs(2 * l - 1)) : 0;
  return `${(h * 60 + 360) % 360} ${s * 100}% ${l * 100}%`;
}

export function SeasonalThemeProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [config, setConfig] = useState(defaultTheme);
  const [preview, setPreview] = useState(false);
  const [clock, setClock] = useState({ server: 0, received: 0 });
  const [tick, setTick] = useState(0);
  const [standard, setStandard] = useState(false);
  const [paused, setPaused] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    setStandard(new URLSearchParams(location.search).get('seasonal-preview') === '1' ? false : preference('sl-seasonal-standard') === 'true');
    setPaused(preference('sl-seasonal-paused') === 'true');
    const mq = matchMedia('(max-width: 767px)');
    const change = () => setMobile(mq.matches);
    change(); mq.addEventListener('change', change);
    const storage = () => { setStandard(preference('sl-seasonal-standard') === 'true'); setPaused(preference('sl-seasonal-paused') === 'true'); };
    window.addEventListener('storage', storage);
    return () => { mq.removeEventListener('change', change); window.removeEventListener('storage', storage); };
  }, []);

  useEffect(() => {
    // Protected tools do not even fetch seasonal configuration.
    if (!eligibleRoute(pathname, defaultTheme)) return;
    let stopped = false;
    let inFlight = false;
    let abort: AbortController | undefined;
    const isPreview = new URLSearchParams(location.search).get('seasonal-preview') === '1';
    const load = async () => {
      if (inFlight || document.hidden) return;
      inFlight = true;
      const controller = new AbortController();
      abort = controller;
      const timeout = setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(`/api/seasonal-theme${isPreview ? '?preview=1' : ''}`, { cache: 'no-store', signal: controller.signal });
        if (!response.ok) throw new Error('Theme unavailable');
        const data = await response.json();
        const parsed = themeSchema.safeParse(data.config);
        if (!parsed.success || !Number.isFinite(data.serverNow)) throw new Error('Invalid theme');
        if (!stopped) { setConfig(current => JSON.stringify(current) === JSON.stringify(parsed.data) ? current : parsed.data); setPreview(data.preview === true); setClock({ server: data.serverNow, received: performance.now() }); }
      } catch { /* A failed refresh never renews the 60-second validity lease. */ }
      finally { clearTimeout(timeout); inFlight = false; }
    };
    const visibility = () => { setHidden(document.hidden); if (!document.hidden) void load(); };
    void load();
    const timer = setInterval(() => { setTick(n => n + 1); if (!document.hidden) void load(); }, 10_000);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('online', visibility);
    return () => { stopped = true; abort?.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('online', visibility); };
  }, [pathname]);

  const now = clock.server ? clock.server + (typeof performance === 'undefined' ? 0 : performance.now() - clock.received) : 0;
  const resolved = resolveTheme(config, now, preview);
  const valid = clock.server > 0 && performance.now() - clock.received < 60_000;
  const available = valid && resolved.active && eligibleRoute(pathname, config) && (!mobile || config.areas.mobile);
  const active = available && !standard;

  useEffect(() => {
    if (!active || !resolved.end) return;
    const timer = setTimeout(() => setTick(n => n + 1), Math.max(0, Math.min(resolved.end - now, 2_147_000_000)));
    return () => clearTimeout(timer);
  }, [active, resolved.end, clock, tick]);

  useLayoutEffect(() => {
    const body = document.body;
    if (!active) return;
    body.dataset.seasonal = 'halloween';
    for (const key of ['palette', 'header', 'hero', 'footer'] as const) if (config.areas[key]) body.setAttribute(`data-seasonal-${key}`, 'true');
    if (paused || hidden || !config.areas.animations) body.dataset.seasonalPaused = 'true';
    body.style.setProperty('--seasonal-background', config.colours.background);
    body.style.setProperty('--seasonal-surface', config.colours.surface);
    body.style.setProperty('--seasonal-text', config.colours.text);
    body.style.setProperty('--seasonal-accent', config.colours.accent);
    body.style.setProperty('--seasonal-secondary', config.colours.secondary);
    body.style.setProperty('--seasonal-footer-image', config.media.footer ? `url("${config.media.footer}")` : 'none');
    const pairs = { background: config.colours.background, card: config.colours.surface, popover: config.colours.surface, foreground: config.colours.text, 'card-foreground': config.colours.text, 'popover-foreground': config.colours.text, primary: config.colours.accent, 'primary-foreground': '#160F24', secondary: config.colours.surface, 'secondary-foreground': config.colours.text, muted: config.colours.surface, 'muted-foreground': '#D0C4DB', border: '#5C456D', input: '#5C456D', ring: config.colours.accent, 'accent-1': config.colours.accent, 'accent-3': config.colours.secondary };
    // Use prefixed variables in CSS instead of overwriting standard inline values.
    if (config.areas.palette) Object.entries(pairs).forEach(([key, value]) => body.style.setProperty(`--seasonal-token-${key}`, hsl(value)));
    return () => {
      for (const name of [...body.attributes].map(a => a.name).filter(n => n.startsWith('data-seasonal'))) body.removeAttribute(name);
      for (const name of [...body.style].filter(n => n.startsWith('--seasonal-'))) body.style.removeProperty(name);
    };
  }, [active, config, paused, hidden]);

  return <ThemeContext.Provider value={{ config, active, paused: paused || hidden, preview }}>
    {children}
    {available && <div className="seasonal-controls" aria-label="Halloween appearance controls">
      {preview && <span>Private preview</span>}
      <button onClick={() => { setStandard(!standard); if (!preview) remember('sl-seasonal-standard', String(!standard)); }}>{standard ? 'Halloween appearance' : 'Standard appearance'}</button>
      {active && <button aria-pressed={paused} onClick={() => { setPaused(!paused); remember('sl-seasonal-paused', String(!paused)); }}>{paused ? 'Resume effects' : 'Pause effects'}</button>}
      {active && config.areas.sound && pathname === '/' && <SeasonalAudio config={config} paused={paused || hidden} />}
    </div>}
    {active && config.areas.popup && (!config.popup.expiresAt || now < Date.parse(config.popup.expiresAt)) && <SeasonalPopup key={`${pathname}-${resolved.id}`} config={config} occurrence={resolved.id} preview={preview} />}
  </ThemeContext.Provider>;
}

function SeasonalAudio({ config, paused }: { config: SeasonalTheme; paused: boolean }) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const stopRef = useRef<() => void>(() => {});
  const stop = () => { stopRef.current(); stopRef.current = () => {}; setPlaying(false); };
  useEffect(() => { if (paused || !config.areas.sound) stop(); return () => stopRef.current(); }, [paused, config]);
  // Public educational media always takes priority. Protected routes unmount this component.
  useEffect(() => {
    const onPlay = (e: Event) => { if ((e.target as HTMLElement)?.dataset?.seasonalAudio !== 'true') stop(); };
    const onMedia = () => stop();
    document.addEventListener('play', onPlay, true);
    window.addEventListener('smartlabs:media-active', onMedia);
    return () => { document.removeEventListener('play', onPlay, true); window.removeEventListener('smartlabs:media-active', onMedia); };
  }, []);
  const start = async () => {
    if (playing) { stop(); return; }
    if (paused) return;
    setError('');
    try {
      if (config.media.audio) {
        const audio = new Audio(config.media.audio);
        audio.dataset.seasonalAudio = 'true'; audio.loop = true; audio.volume = config.volume;
        stopRef.current = () => { audio.pause(); audio.removeAttribute('src'); audio.load(); };
        audio.onerror = () => { stop(); setError('Sound unavailable'); };
        await audio.play();
      } else {
        // Original, quiet synthesized ambience: no third-party recording or licence required.
        const ctx = new AudioContext();
        const gain = ctx.createGain(); gain.gain.setValueAtTime(0, ctx.currentTime); gain.gain.linearRampToValueAtTime(config.volume * 0.12, ctx.currentTime + 2); gain.connect(ctx.destination);
        const oscillators = [130.81, 196, 261.63].map((frequency, i) => { const oscillator = ctx.createOscillator(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; oscillator.detune.value = i * 2; oscillator.connect(gain); oscillator.start(); return oscillator; });
        stopRef.current = () => { oscillators.forEach(o => o.stop()); void ctx.close(); };
        await ctx.resume();
      }
      setPlaying(true);
    } catch { stop(); setError('Sound unavailable'); }
  };
  return <button onClick={() => void start()} aria-pressed={playing} disabled={paused} title={error || 'Sound starts only when you choose it'}>{error || (playing ? 'Mute Halloween sound' : 'Enable Halloween sound')}</button>;
}

function SeasonalPopup({ config, occurrence, preview }: { config: SeasonalTheme; occurrence: string; preview: boolean }) {
  const [open, setOpen] = useState(false);
  const lastFocused = useRef<HTMLElement | null>(null);
  const day = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
  const key = `sl-halloween-popup-${occurrence}-${config.popup.frequency === 'daily' ? day : config.popup.frequency}`;
  const storage = () => config.popup.frequency === 'session' ? sessionStorage : localStorage;
  const close = () => { setOpen(false); try { storage().setItem(key, 'seen'); } catch { /* Private browsing. */ } };
  useEffect(() => {
    try { if (!preview && storage().getItem(key)) return; } catch { /* Still bounded to this mount. */ }
    // Existing promotions keep priority. Observe their overlays instead of changing their logic.
    const anotherOverlay = () => [...document.querySelectorAll<HTMLElement>('[role="dialog"], [role="alertdialog"], .fixed.inset-0, .fixed.bottom-0.left-0.right-0')].some(el => {
      if (el.closest('[data-seasonal-popup]') || el.nextElementSibling?.hasAttribute('data-seasonal-popup')) return false;
      // The existing mouse spotlight covers the viewport but never blocks clicks.
      // EventPopup has a non-interactive wrapper with interactive children, so
      // it still counts as a promotion that must retain priority.
      if (el.classList.contains('pointer-events-none') && !el.querySelector('.pointer-events-auto')) return false;
      return el.getBoundingClientRect().height > 0;
    });
    const timer = setTimeout(() => {
      if (anotherOverlay() || document.hidden) return;
      lastFocused.current = document.activeElement as HTMLElement;
      try { if (!preview) storage().setItem(key, 'seen'); } catch { /* Session-only fallback. */ }
      setOpen(true);
    }, config.popup.delay * 1000);
    const observer = new MutationObserver(() => { if (anotherOverlay()) setOpen(false); });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => { clearTimeout(timer); observer.disconnect(); };
  }, [key, config.popup.delay, preview]);
  return <Dialog open={open} onOpenChange={value => { if (!value) close(); }}>
    <DialogContent data-seasonal-popup className="seasonal-popup" onCloseAutoFocus={event => { event.preventDefault(); lastFocused.current?.focus(); }}>
      {config.media.popup && <img src={config.media.popup} alt="" className="seasonal-popup-background" onError={e => { e.currentTarget.style.display = 'none'; }} />}
      {config.areas.characters && config.media.character && <img src={config.media.character} alt="" className="seasonal-popup-character" onError={e => { e.currentTarget.style.display = 'none'; }} />}
      <div className="relative z-10"><p className="seasonal-eyebrow">Halloween at Smart Labs</p><DialogTitle className="text-3xl font-bold my-4">{config.popup.title}</DialogTitle><DialogDescription className="!text-[#FFF6E8] leading-relaxed">{config.popup.body}</DialogDescription>
        <Link className="seasonal-cta mt-6 inline-flex" href={config.popup.href} onClick={close}>{config.popup.button || 'Explore courses'}</Link>
      </div>
    </DialogContent>
  </Dialog>;
}
