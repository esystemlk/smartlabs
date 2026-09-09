import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Star, Home, ArrowUpRight, MapPin, Phone, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welcome to Smart Labs',
  description: 'Leave us a Google review or explore our website — Smart Labs, Nugegoda.',
  robots: { index: false, follow: true },
};

// Your Google Business listing (visitors tap "Rate and review" there).
// To use a one-tap review link, replace this with your "Get more reviews"
// link from Google Business Profile (e.g. https://g.page/r/…/review).
const REVIEW_URL = 'https://maps.app.goo.gl/sK4iE7wum7nFo66M7';
const PHONE = '+94774533233';

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* ── Animated brand background ── */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[#fbfbfe]">
        <span className="wl-blob wl-blob--blue" />
        <span className="wl-blob wl-blob--pink" />
        <span className="wl-blob wl-blob--amber" />
        <span className="wl-blob wl-blob--green" />
        <span className="absolute inset-0 [background-image:radial-gradient(circle,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:22px_22px]" />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="wl-in mb-7 flex justify-center" style={{ animationDelay: '0ms' }}>
          <div className="relative">
            <div aria-hidden className="absolute inset-0 -z-10 blur-2xl" style={{ background: 'radial-gradient(circle, hsl(217 91% 60% / 0.35), transparent 70%)' }} />
            <Image src="/logo.png" alt="Smart Labs" width={240} height={86} priority className="h-auto w-56" />
          </div>
        </div>

        {/* Glass card */}
        <div className="wl-in overflow-hidden rounded-[28px] border border-white/70 bg-white/70 p-6 shadow-[0_30px_80px_-30px_rgba(37,99,235,0.35)] ring-1 ring-black/[0.03] backdrop-blur-xl sm:p-8" style={{ animationDelay: '90ms' }}>
          {/* Rating badge */}
          <div className="mb-5 flex justify-center">
            <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-700 shadow-sm">
              <span className="flex">
                {[0, 1, 2, 3, 4].map(i => <Star key={i} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />)}
              </span>
              4.9 · 250+ Google reviews
            </a>
          </div>

          <h1 className="text-center text-[26px] font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">
            Welcome to Smart Labs
          </h1>
          <p className="mx-auto mt-2 flex max-w-xs items-center justify-center gap-1.5 text-center text-sm text-slate-500">
            <Sparkles className="h-4 w-4 text-primary" /> Thanks for scanning — how can we help?
          </p>

          {/* Buttons */}
          <div className="mt-7 space-y-3.5">
            {/* Google review (primary CTA) */}
            <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer"
              className="wl-shine group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-amber-400 via-orange-500 to-orange-600 px-5 py-4 text-white shadow-lg shadow-orange-500/30 transition-transform duration-200 active:scale-[0.98]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                <Star className="h-6 w-6 fill-white" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold leading-tight">Leave us a Google Review</span>
                <span className="block text-xs text-white/90">Rate your experience — it means a lot!</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 opacity-90 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>

            {/* Website home */}
            <Link href="/"
              className="wl-shine group relative flex items-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 px-5 py-4 text-white shadow-lg shadow-blue-600/30 transition-transform duration-200 active:scale-[0.98]">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/30">
                <Home className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-extrabold leading-tight">Visit our Website</span>
                <span className="block text-xs text-white/90">Courses, mock tests & AI practice</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 opacity-90 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          {/* Contact strip */}
          <div className="mt-7 flex flex-col items-center gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-center sm:gap-5">
            <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-800">
              <MapPin className="h-3.5 w-3.5" /> 19/3 Poorwarama Rd, Nugegoda
            </a>
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-1.5 transition-colors hover:text-slate-800">
              <Phone className="h-3.5 w-3.5" /> {PHONE}
            </a>
          </div>
        </div>

        <p className="wl-in mt-6 text-center text-[11px] font-medium tracking-wide text-slate-400" style={{ animationDelay: '180ms' }}>
          SMART LABS · Nugegoda, Sri Lanka
        </p>
      </div>

      {/* Scoped animations (server-component-safe raw CSS) */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .wl-in{opacity:0;transform:translateY(14px);animation:wlIn .7s cubic-bezier(.22,1,.36,1) forwards}
        @keyframes wlIn{to{opacity:1;transform:none}}
        .wl-blob{position:absolute;border-radius:9999px;filter:blur(60px);opacity:.55;will-change:transform}
        .wl-blob--blue{width:44vmax;height:44vmax;left:-14vmax;top:-16vmax;background:hsl(217 91% 60% / .5);animation:wlDrift1 18s ease-in-out infinite}
        .wl-blob--pink{width:38vmax;height:38vmax;right:-12vmax;top:-8vmax;background:hsl(347 89% 68% / .45);animation:wlDrift2 22s ease-in-out infinite}
        .wl-blob--amber{width:40vmax;height:40vmax;right:-10vmax;bottom:-16vmax;background:hsl(38 92% 60% / .45);animation:wlDrift1 20s ease-in-out infinite reverse}
        .wl-blob--green{width:34vmax;height:34vmax;left:-10vmax;bottom:-12vmax;background:hsl(159 70% 55% / .4);animation:wlDrift2 24s ease-in-out infinite reverse}
        @keyframes wlDrift1{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(6vmax,4vmax) scale(1.08)}}
        @keyframes wlDrift2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-5vmax,5vmax) scale(1.06)}}
        .wl-shine::after{content:"";position:absolute;top:0;left:-60%;width:40%;height:100%;background:linear-gradient(115deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);animation:wlShine 4.5s ease-in-out infinite}
        @keyframes wlShine{0%,68%{left:-60%}82%,100%{left:130%}}
        @media (prefers-reduced-motion: reduce){.wl-in,.wl-blob,.wl-shine::after{animation:none!important}.wl-in{opacity:1;transform:none}}
      `,
        }}
      />
    </main>
  );
}
