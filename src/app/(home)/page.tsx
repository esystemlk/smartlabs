'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { getLatestVideos, type YouTubeVideo } from '@/app/actions/get-youtube-videos';
import { IELTS_URL } from '@/lib/constants';
import { IntroSplash } from './intro-splash';

/* New homepage: design/home-redesign/v3 (photo-frame desktop, app-style phone). Styles: ./home.css */

const SLIDES = [
  { word: 'degree', img: '/home/hero-degree', chip: 'Computer-based exam practice · PTE & IELTS', tag: 'Exam-style practice', label: 'Free level test', meta: 'PTE & IELTS · Online & Nugegoda', go: 'Start', href: '/level-test' },
  { word: 'career', img: '/home/hero-career', chip: 'Small classes · expert lecturers', tag: 'Live classes', label: 'Courses', meta: 'Live classes · recordings · 1:1', go: 'Browse', href: '/courses' },
  { word: 'journey', img: '/home/hero-journey', chip: 'Listening practice from home', tag: 'Practise at home', label: 'Mock tests', meta: 'Full timed PTE & IELTS mocks', go: 'Try', href: '/mock-tests' },
  { word: 'future', img: '/home/hero-future', chip: 'Essay writing · instant AI score', tag: 'Writing practice', label: 'AI practice', meta: 'Instant AI scores on every task', go: 'Practise', href: '/ai-essay-practice' },
];

const MODULES = [
  { title: 'Courses', sub: 'Live classes, recordings, one-to-one', short: 'PTE · IELTS · 1:1', img: '/home/card-courses.webp', href: '/courses' },
  { title: 'Level Test', sub: 'Free · know your level first', short: 'Free', img: '/home/card-level.webp', href: '/level-test' },
  { title: 'Mock Tests', sub: 'Full timed mocks, scored', short: 'Full & timed', img: '/home/card-mocks.webp', href: '/mock-tests' },
  { title: 'AI Trainers', sub: 'Instant scores on every task', short: 'Instant scores', img: '/home/card-ai.webp', href: '/ai-essay-practice' },
];

const ic = (d: React.ReactNode) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>;
const ICONS = {
  book: ic(<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></>),
  gauge: ic(<><path d="M12 14l4-4" /><path d="M3.3 16a9 9 0 1 1 17.4 0" /></>),
  sheet: ic(<><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 8h6M9 12h6" /></>),
  pen: ic(<path d="M4 20h4L19 9l-4-4L4 16z" />),
  lines: ic(<path d="M4 6h16M4 12h10M4 18h7" />),
  wave: ic(<path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2" />),
  phones: ic(<><path d="M3 18v-6a9 9 0 0 1 18 0v6" /><rect x="3" y="14" width="4" height="6" rx="1" /><rect x="17" y="14" width="4" height="6" rx="1" /></>),
  edit: ic(<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />),
  people: ic(<><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20a6 6 0 0 1 12 0M14 20a4 4 0 0 1 7 0" /></>),
  play: <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.4-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" /></svg>,
  grid: ic(<><rect x="3" y="3" width="7" height="7" rx="2" /><rect x="14" y="3" width="7" height="7" rx="2" /><rect x="3" y="14" width="7" height="7" rx="2" /><rect x="14" y="14" width="7" height="7" rx="2" /></>),
  search: ic(<><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>),
  phone: ic(<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />),
  pin: ic(<><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  chat: ic(<path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12z" />),
  share: ic(<path d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />),
  home: ic(<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />),
  user: ic(<><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>),
  sliders: ic(<><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></>),
};

const ORBIT = [
  { t: 'Courses', s: 'PTE · IELTS', i: 'courses', href: '/courses' },
  { t: 'Level Test', s: 'free', i: 'level', href: '/level-test' },
  { t: 'PTE', s: 'courses & practice', i: 'pte', href: '/pte-registration' },
  { t: 'IELTS', s: 'IELTS studio', i: 'ielts', href: IELTS_URL },
  { t: 'PTE Mock', s: 'full & timed', i: 'pte-mock', href: '/mock-tests' },
  { t: 'IELTS Mock', s: 'full & timed', i: 'ielts-mock', href: IELTS_URL },
  { t: 'AI Practice', s: 'instant scores', i: 'ai', href: '/ai-essay-practice' },
  { t: 'One-to-One', s: 'book a lecturer', i: 'one-to-one', href: '/one-to-one' },
  { t: 'Grammar Clinic', s: 'build the basics', i: 'grammar', href: '/courses/grammar-clinic' },
  { t: 'Videos', s: 'free lessons', i: 'videos', href: '/videos' },
];

// Same three results and recommendations the level test gives (src/app/level-test/page.tsx).
const LEVELS = [
  { name: 'Beginner', course: 'Grammar Clinic' },
  { name: 'Intermediate', course: 'PTE Boostify · Foundation' },
  { name: 'Advanced', course: 'PTE Boostify · Standard' },
];

const PHONES = [
  { label: '076 691 4650', tel: 'tel:+94766914650' },
  { label: '077 453 3233', tel: 'tel:+94774533233' },
  { label: '070 691 4652', tel: 'tel:+94706914652' },
];
const openSearch = () => window.dispatchEvent(new Event('open-command-palette'));

interface Review { author_name: string; author_url?: string; profile_photo_url?: string; rating: number; relative_time_description: string; text: string }
interface ReviewData { rating: number; user_ratings_total: number; reviews: Review[] }

/** Adds .in once an element scrolls into view. */
function useReveal<T extends Element>(cb?: () => void | (() => void)) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cleanup: void | (() => void);
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { el.classList.add('in'); cleanup = cb?.(); io.disconnect(); } }, { threshold: .2 });
    io.observe(el);
    return () => { io.disconnect(); cleanup?.(); };
  }, [cb]);
  return ref;
}

function Reveal({ className = '', children }: { className?: string; children: React.ReactNode }) {
  const ref = useReveal<HTMLDivElement>();
  return <div ref={ref} className={`rvl ${className}`}>{children}</div>;
}

// Star rating drawn with icons (filled up to the rating, outlined after).
const STAR_PATH = 'M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5-4.8-4.6 6.6-.9z';
function Stars({ n }: { n: number }) {
  const full = Math.round(n);
  return <span className="stars" role="img" aria-label={`${n} out of 5 stars`}>{[0, 1, 2, 3, 4].map(k => (
    <svg key={k} viewBox="0 0 24 24" aria-hidden="true" fill={k < full ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"><path d={STAR_PATH} /></svg>
  ))}</span>;
}

export default function HomePage() {
  const { user } = useUser();
  const [slide, setSlide] = useState(0);
  const [prev, setPrev] = useState<number | null>(null);
  const [greet, setGreet] = useState('Welcome to Smart Labs');
  const [videos, setVideos] = useState<YouTubeVideo[] | null>(null);
  const [reviews, setReviews] = useState<ReviewData | null>(null);
  const [feedIdx, setFeedIdx] = useState(0);
  const rotRef = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setInterval>>();

  // Hero rotation: word, photo, chip and highlighted module change together.
  const go = useCallback((n: number) => setSlide(s => { if (n !== s) setPrev(s); return n; }), []);
  const loop = useCallback(() => {
    clearInterval(timer.current);
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    timer.current = setInterval(() => setSlide(s => { setPrev(s); return (s + 1) % SLIDES.length; }), 4200);
  }, []);
  useEffect(() => { loop(); return () => clearInterval(timer.current); }, [loop]);

  // The word slot resizes to the current word so the line stays centred.
  useEffect(() => {
    const fit = () => { const el = rotRef.current?.children[slide] as HTMLElement | undefined; if (el && rotRef.current) rotRef.current.style.width = el.offsetWidth + 'px'; };
    fit();
    document.fonts?.ready.then(fit);
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, [slide]);

  // Loading placeholders stop shimmering once everything has loaded (saves work on every frame).
  useEffect(() => {
    const done = () => { document.documentElement.dataset.loaded = '1'; };
    if (document.readyState === 'complete') done(); else window.addEventListener('load', done, { once: true });
    return () => window.removeEventListener('load', done);
  }, []);

  useEffect(() => {
    const h = new Date().getHours();
    setGreet(h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening');
    let live = true;
    getLatestVideos().then(v => live && setVideos(v.slice(0, 3))).catch(() => live && setVideos([]));
    fetch('/api/google-reviews').then(r => r.ok ? r.json() : null).then(d => {
      if (live && d && Array.isArray(d.reviews) && d.reviews.length) setReviews(d);
    }).catch(() => {});
    return () => { live = false; };
  }, []);

  // Orbit: modules fly out from the centre into a ring.
  const orbitRef = useRef<HTMLDivElement>(null);
  const [orbitOpen, setOrbitOpen] = useState(false);
  const openOrbit = useCallback(() => setOrbitOpen(true), []);
  useEffect(() => {
    const el = orbitRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { openOrbit(); io.disconnect(); } }, { threshold: .3 });
    io.observe(el);
    return () => io.disconnect();
  }, [openOrbit]);
  const [orbitSize, setOrbitSize] = useState({ w: 1200, h: 600 });
  useEffect(() => {
    const m = () => orbitRef.current && setOrbitSize({ w: orbitRef.current.clientWidth, h: orbitRef.current.clientHeight });
    m(); addEventListener('resize', m);
    return () => removeEventListener('resize', m);
  }, []);

  // Level-test gauge: once visible, the needle steps through the three result levels.
  const [lvl, setLvl] = useState(1);
  const startGauge = useCallback(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let k = 0; setLvl(0);
    const t = setInterval(() => { k = (k + 1) % LEVELS.length; setLvl(k); }, 2200);
    return () => clearInterval(t);
  }, []);
  const gaugeRef = useReveal<HTMLDivElement>(startGauge);

  const share = async (e: React.MouseEvent) => {
    const data = { title: 'Smart Labs', text: 'PTE & IELTS classes and AI practice', url: location.origin };
    try { if (navigator.share) await navigator.share(data); else await navigator.clipboard.writeText(data.url); } catch { /* user cancelled */ }
  };

  const account = user ? '/dashboard' : '/login';
  const cur = SLIDES[slide];

  const videoCards = (cls: 'vid' | 'hv') => (videos ?? [null, null, null]).map((v, k) => v ? (
    <a key={v.id} className={cls} href={`https://www.youtube.com/watch?v=${v.id}`} target="_blank" rel="noopener noreferrer">
      <div className="t" style={{ backgroundImage: `url(${v.thumbnail})` }}><span className="play" style={{ color: '#fff' }}><span style={{ width: 20, height: 20, display: 'block' }}>{ICONS.play}</span></span></div>
      {cls === 'vid' ? <><h4>{v.title}</h4><small>{v.date}</small></> : <b>{v.title}</b>}
    </a>
  ) : <div key={k} className={cls} aria-hidden="true"><div className="t skel" />{cls === 'vid' ? <h4>&nbsp;</h4> : <b>&nbsp;</b>}</div>);

  const reviewCards = reviews?.reviews.map(r => (
    <article key={r.author_name + r.relative_time_description} className="rv-card">
      <Stars n={r.rating} />
      <p>{r.text}</p>
      <div className="rv-who">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {r.profile_photo_url && <img src={r.profile_photo_url} alt="" loading="lazy" referrerPolicy="no-referrer" />}
        <div><b>{r.author_name}</b><small>{r.relative_time_description} · Google</small></div>
      </div>
    </article>
  ));
  const REVIEWS_URL = 'https://www.google.com/maps/search/?api=1&query=Smart+Labs+Nugegoda';

  return (
    // data-seasonal-skip: seasonal themes keep their logo/decorations here but don't repaint this page's own palette.
    <div className="slh" data-seasonal-skip="">
      <IntroSplash />
      <h1 className="sr-only">Smart Labs — PTE and IELTS classes in Sri Lanka</h1>

      {/* ═════════ DESKTOP / TABLET ═════════ */}
      <div className="backdrop d" aria-hidden="true" style={{ backgroundImage: `url(${cur.img}-blur.webp)` }} />
      <div className="shell d">
        <section className="rim">
          <div className="panel hero">
            <div className="slides">
              {SLIDES.map((s, k) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={s.word} className={k === slide ? 'on' : ''} src={`${s.img}.webp`} alt="" fetchPriority={k === 0 ? 'high' : 'low'} loading={k === 0 ? 'eager' : 'lazy'} />
              ))}
            </div>
            <div className="shade" />
            <Link className="notch" href="/" aria-label="Smart Labs home">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Smart Labs" />
            </Link>
            <nav className="topnav" aria-label="Main">
              <div className="pills">
                <Link className="gp" href="/courses">Courses</Link>
                <Link className="gp" href="/ai-essay-practice">AI Practice</Link>
                <Link className="gp hide-md" href="/mock-tests">Mock Tests</Link>
                <Link className="gp hide-md" href="/videos">Videos</Link>
                <button className="gp" onClick={openSearch} aria-label="Search the site">{ICONS.search}<span className="hide-md">Search</span></button>
              </div>
              <div className="pills">
                {user ? (
                  <Link className="cta-w" href="/dashboard">Dashboard <i>→</i></Link>
                ) : (<>
                  <Link className="gp" href="/login">Log in</Link>
                  <Link className="cta-w" href="/signup">Get started <i>→</i></Link>
                </>)}
              </div>
            </nav>
            <div className="hero-copy">
              <p className="h1" aria-label={`Get the score for your ${cur.word}.`}>
                Get the score<br />for your{' '}
                <span className="rot" ref={rotRef} aria-hidden="true">
                  {SLIDES.map((s, k) => <span key={s.word} className={k === slide ? 'on' : k === prev ? 'out' : ''}>{s.word}<i className="dot">.</i></span>)}
                </span>
              </p>
              <p className="sub">PTE &amp; IELTS coaching with expert lecturers, real exam mocks and AI that scores your practice in seconds.</p>
              <div className="hero-btns">
                <Link className="btn btn-yellow" href="/level-test">Take the free level test →</Link>
                <Link className="btn btn-ghost" href="/courses">Browse courses</Link>
              </div>
            </div>
            <div className="hero-foot">
              <div className="exams">
                <b>PTE · IELTS</b>
                <small>Online and in Nugegoda, Sri Lanka</small>
                <div className="flags"><span>PTE Academic</span><span>IELTS</span><span>Grammar Clinic</span></div>
              </div>
              <div className="thumbs">
                {MODULES.map((m, k) => (
                  <Link key={m.title} className={`th${k === slide ? ' on' : ''}`} href={m.href} onMouseEnter={() => { go(k); loop(); }} onFocus={() => go(k)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.img} alt="" loading="lazy" />
                    <div className="info"><b>{m.title}</b><small>{m.sub}</small></div>
                    <span className="go" aria-hidden="true">↗</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rim">
          <div className="panel paper">
            <Reveal className="p-head">
              <div className="p-icon">{ICONS.grid}</div>
              <h2>Everything in <em>one place</em></h2>
              <p>Pick where you want to start.</p>
            </Reveal>
            <div className="orbit" ref={orbitRef}>
              <div className="core">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/logo.png" alt="" />
              </div>
              {ORBIT.map((n, k) => {
                const a = -Math.PI / 2 + k * 2 * Math.PI / ORBIT.length;
                // Keep every card (about 140px tall) fully inside the panel.
                const rx = Math.min(orbitSize.w * .4, 470), ry = Math.max(orbitSize.h / 2 - 85, 120);
                return (
                  <Link key={n.t} href={n.href} className="node" style={orbitOpen ? { opacity: 1, transform: `translate(${Math.cos(a) * rx}px, ${Math.sin(a) * ry}px) scale(1)`, transitionDelay: `${k * 60}ms` } : undefined}>
                    <span className="ni">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={`/icons/3d/orbit-${n.i}.webp`} alt="" loading="lazy" /></span><b>{n.t}</b><small>{n.s}</small>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rim">
          <div className="panel lvl">
            <div className="lvl-copy">
              <span className="lvl-kicker"><i>Free</i> No payment · result on screen</span>
              <h2>Know your level <em>before</em> you start.</h2>
              <p>One short test shows where your English is today and which course gets you to your target score.</p>
              <ol className="lvl-steps">
                <li><b>1</b><div><strong>Answer the questions</strong><small>Grammar, vocabulary and reading</small></div></li>
                <li><b>2</b><div><strong>See your level</strong><small>Beginner, Intermediate or Advanced</small></div></li>
                <li><b>3</b><div><strong>Get your course</strong><small>We recommend the right class for you</small></div></li>
              </ol>
              <Link className="btn btn-ink" href="/level-test">Take the free level test →</Link>
            </div>
            <div className="lvl-visual" ref={gaugeRef} aria-hidden="true">
              <div className="gauge-card">
                <svg viewBox="0 0 240 140" className="gauge">
                  <path d="M20 120 A100 100 0 0 1 77 30" className="seg s1" />
                  <path d="M86 25 A100 100 0 0 1 154 25" className="seg s2" />
                  <path d="M163 30 A100 100 0 0 1 220 120" className="seg s3" />
                  <g className="needle" style={{ transform: `rotate(${(lvl - 1) * 60}deg)` }}>
                    <path d="M120 120 L120 38" />
                  </g>
                  <circle cx="120" cy="120" r="11" className="hub" />
                </svg>
                <div className="gauge-labels">{LEVELS.map((l, k) => <span key={l.name} className={k === lvl ? 'on' : ''}>{l.name}</span>)}</div>
                <div className="gauge-read"><small>Your level</small><b>{LEVELS[lvl].name}</b></div>
              </div>
              <div className="rec-card">
                <span className="rec-ico">{ICONS.book}</span>
                <div><small>Recommended course</small><b>{LEVELS[lvl].course}</b></div>
              </div>
            </div>
          </div>
        </section>

        {reviews && (
          <section className="rim">
            <div className="panel paper reviews">
              <Reveal className="row-head">
                <h2>What students <em>say</em></h2>
                <div className="g-score">
                  <b>{reviews.rating.toFixed(1)}</b>
                  <div><Stars n={reviews.rating} /><small>{reviews.user_ratings_total} Google reviews</small></div>
                  <a href={REVIEWS_URL} target="_blank" rel="noopener noreferrer">See on Google →</a>
                </div>
              </Reveal>
              <div className="rv-track">{reviewCards}</div>
            </div>
          </section>
        )}

        <section className="rim">
          <div className="panel paper vids-wrap">
            {videos?.length !== 0 && <>
              <Reveal className="row-head"><h2>Latest <em>videos</em></h2><Link href="/videos">See all →</Link></Reveal>
              <div className="vids">{videoCards('vid')}</div>
            </>}
            <Reveal className="contact">
              <div><h3>Not sure where to <em>start?</em></h3><p>Talk to us and we&apos;ll suggest the right course for your target.</p></div>
              <div className="acts">
                <Link className="btn btn-yellow" href="/contact">Contact us</Link>
                {PHONES.map(p => <a key={p.tel} className="btn btn-ghost btn-call" href={p.tel}>{ICONS.phone}{p.label}</a>)}
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {/* ═════════ PHONES ═════════ */}
      <div className="m app">
        <header className="a-top">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="a-logo" src="/logo.png" alt="Smart Labs" />
          <div><small>{greet}</small><b>{ICONS.pin}Nugegoda · Online</b></div>
          <Link className="round" href="/contact" aria-label="Contact us">{ICONS.chat}</Link>
        </header>

        <p className="a-h1">Find your path to a <em>higher score</em></p>

        <button className="search" onClick={openSearch}>
          {ICONS.search}<span>Search courses, practice, mocks…</span><i>{ICONS.sliders}</i>
        </button>

        <nav className="chips" aria-label="Quick links">
          <a className="on" href="#for-you">For you</a>
          <Link href="/pte-registration">PTE</Link>
          <Link href={IELTS_URL}>IELTS</Link>
          <Link href="/ai-essay-practice">AI Practice</Link>
          <Link href="/mock-tests">Mocks</Link>
          <Link href="/videos">Videos</Link>
        </nav>

        <div id="for-you" className="feed" onScroll={e => { const el = e.currentTarget; setFeedIdx(Math.round(el.scrollLeft / ((el.firstElementChild as HTMLElement)?.offsetWidth || 1))); }}>
          {SLIDES.map(s => (
            <div key={s.word} className="fcard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`${s.img}-sm.webp`} alt="" loading="lazy" />
              <span className="f-chip">{s.label}</span>
              <div className="f-body">
                <span className="f-tag">{s.tag}</span>
                <h3>Get the score for your <em>{s.word}</em></h3>
                <div className="f-row"><small>{s.meta}</small><span className="f-go">{s.go} <i>↗</i></span></div>
              </div>
              {/* Whole card is the link; share sits above it (a button can't live inside a link). */}
              <Link className="f-link" href={s.href} aria-label={`${s.label}: get the score for your ${s.word}`} />
              <button className="f-share" onClick={share} aria-label="Share Smart Labs">{ICONS.share}</button>
            </div>
          ))}
        </div>
        <div className="dots" aria-hidden="true">{SLIDES.map((s, k) => <i key={s.word} className={k === feedIdx ? 'on' : ''} />)}</div>

        <div className="a-sec"><h2>Start <em>here</em></h2><Link href="/courses">See all</Link></div>
        <div className="tiles">
          {MODULES.map(m => (
            <Link key={m.title} className="tile" href={m.href}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.img} alt="" loading="lazy" /><b>{m.title}</b><small>{m.short}</small>
            </Link>
          ))}
        </div>

        <div className="ai"><span className="spark">{ICONS.pen}</span><div><b>Try AI essay scoring</b><p>Write a PTE essay and get a score with line-by-line fixes in seconds.</p><Link href="/ai-essay-practice">Start writing →</Link></div></div>

        {reviews && <>
          <div className="a-sec"><h2>Student <em>reviews</em></h2><a href={REVIEWS_URL} target="_blank" rel="noopener noreferrer">Google</a></div>
          <div className="a-score"><b>{reviews.rating.toFixed(1)}</b><div><Stars n={reviews.rating} /><small>{reviews.user_ratings_total} Google reviews</small></div></div>
          <div className="hscroll">{reviewCards}</div>
        </>}

        {videos?.length !== 0 && <>
          <div className="a-sec"><h2>Latest <em>videos</em></h2><Link href="/videos">See all</Link></div>
          <div className="hscroll">{videoCards('hv')}</div>
        </>}

        <div className="a-contact"><b>Not sure where to <em>start?</em></b><p>Tell us your target score and we&apos;ll suggest a course.</p>
          <Link className="btn btn-yellow a-contact-main" href="/contact">Contact us</Link>
          <div className="a-calls">{PHONES.map(p => <a key={p.tel} className="btn btn-ghost btn-call" href={p.tel}>{ICONS.phone}{p.label}</a>)}</div></div>
      </div>

      <nav className="tabbar m" aria-label="Quick">
        <Link className="home" href="/">{ICONS.home}<span>Home</span></Link>
        <Link href="/courses" aria-label="Courses">{ICONS.book}</Link>
        <Link href="/ai-essay-practice" aria-label="AI practice">{ICONS.pen}</Link>
        <Link href="/mock-tests" aria-label="Mock tests">{ICONS.sheet}</Link>
        <Link href={account} aria-label={user ? 'Dashboard' : 'Log in'}>{ICONS.user}</Link>
      </nav>
    </div>
  );
}
