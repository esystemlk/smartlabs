'use client';

import React from 'react';
import Link from 'next/link';
import Lottie from 'lottie-react';
import { House, ArrowLeft } from 'lucide-react';
// Statically imported (bundled) → renders instantly, no fetch flash.
import anim404 from '../../public/404.json';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white px-6 text-center">
      <div style={{ width: 360, maxWidth: '88vw' }}>
        <Lottie animationData={anim404} loop autoplay />
      </div>

      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">Page not found</h1>
      <p className="text-slate-500 mt-2 max-w-md font-medium">
        The page you're looking for doesn't exist or may have moved.
      </p>

      <div className="mt-7 flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#f97316] hover:bg-[#fb923c] text-white font-extrabold text-sm transition-all active:scale-95 shadow-lg shadow-orange-500/20"
        >
          <House size={16} /> Back to Home
        </Link>
        <button
          onClick={() => { if (typeof window !== 'undefined') window.history.back(); }}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-sm transition-all active:scale-95"
        >
          <ArrowLeft size={16} /> Go Back
        </button>
      </div>
    </div>
  );
}
