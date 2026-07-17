'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Lottie from 'lottie-react';
import { Wrench, RefreshCw } from 'lucide-react';
// Statically imported (bundled) → renders instantly, and still works while the
// rest of the site is switched off.
import anim404 from '../../../public/404.json';
import type { SiteMode } from '@/lib/site-mode';

const COPY: Record<Exclude<SiteMode, 'live'>, { title: string; body: string }> = {
  '404': {
    title: 'Page not found',
    body: "The page you're looking for doesn't exist or may have moved.",
  },
  maintenance: {
    title: 'We’ll be right back',
    body: 'Smart Labs is temporarily down for scheduled service. Please check back shortly.',
  },
  updating: {
    title: 'Smart Labs is updating',
    body: 'We’re rolling out an update to make things better. This only takes a little while.',
  },
};

function StatusInner() {
  const params = useSearchParams();
  const mode = (params?.get('mode') as Exclude<SiteMode, 'live'>) ?? '404';
  const copy = COPY[mode] ?? COPY['404'];
  const isDown = mode !== '404';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div style={{ width: 360, maxWidth: '88vw' }}>
        <Lottie animationData={anim404} loop autoplay />
      </div>

      {isDown && (
        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
          {mode === 'updating' ? <RefreshCw size={13} className="animate-spin" /> : <Wrench size={13} />}
          {mode === 'updating' ? 'Updating' : 'Service mode'}
        </span>
      )}

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">{copy.title}</h1>
      <p className="text-slate-500 mt-2 max-w-md font-medium">{copy.body}</p>

      {isDown && (
        <button
          onClick={() => window.location.reload()}
          className="mt-7 inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm transition-all active:scale-95"
        >
          <RefreshCw size={15} /> Try again
        </button>
      )}

      <p className="mt-10 text-[11px] text-slate-400 font-bold uppercase tracking-widest">Smart Labs</p>
    </div>
  );
}

export default function SiteStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <StatusInner />
    </Suspense>
  );
}
