import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Star, Home, ArrowUpRight, MapPin, Phone } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Welcome to Smart Labs',
  description: 'Leave us a Google review or explore our website — Smart Labs, Nugegoda.',
  robots: { index: false, follow: true },
};

// Your Google Business listing (visitors tap "Rate and review" there).
// To use a one-tap review link instead, replace this with your
// "Get more reviews" link from Google Business Profile (e.g. https://g.page/r/…/review).
const REVIEW_URL = 'https://maps.app.goo.gl/sK4iE7wum7nFo66M7';
const PHONE = '+94774533233';

export default function WelcomePage() {
  return (
    <main className="relative flex min-h-[100dvh] flex-col items-center justify-center overflow-hidden px-5 py-10">
      {/* Soft brand gradient background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(60% 55% at 15% 12%, hsl(217 91% 60% / 0.18), transparent 60%),' +
            'radial-gradient(55% 50% at 85% 20%, hsl(347 89% 68% / 0.16), transparent 60%),' +
            'radial-gradient(60% 55% at 78% 92%, hsl(38 92% 60% / 0.16), transparent 60%),' +
            'radial-gradient(50% 50% at 20% 88%, hsl(159 70% 55% / 0.14), transparent 60%),' +
            'hsl(240 10% 99%)',
        }}
      />

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image src="/logo.png" alt="Smart Labs" width={220} height={78} priority className="h-auto w-52" />
        </div>

        <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-blue-500/10 backdrop-blur-sm sm:p-8">
          <h1 className="text-center text-2xl font-black tracking-tight text-slate-900 sm:text-3xl">
            Welcome to Smart Labs 👋
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-center text-sm text-slate-500">
            Thanks for scanning! How can we help you today?
          </p>

          <div className="mt-7 space-y-3">
            {/* Google review */}
            <a
              href={REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-5 py-4 text-white shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Star className="h-6 w-6 fill-white" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-tight">Leave us a Google Review</span>
                <span className="block text-xs text-white/85">Rate your experience — it means a lot!</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5" />
            </a>

            {/* Website home */}
            <Link
              href="/"
              className="group flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4 text-white shadow-lg shadow-blue-600/25 transition-transform active:scale-[0.98]"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/20">
                <Home className="h-6 w-6" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-bold leading-tight">Visit our Website</span>
                <span className="block text-xs text-white/85">Courses, mock tests & AI practice</span>
              </span>
              <ArrowUpRight className="h-5 w-5 shrink-0 opacity-80 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Contact strip */}
          <div className="mt-7 flex flex-col items-center gap-2 border-t border-slate-200/70 pt-5 text-xs text-slate-500 sm:flex-row sm:justify-center sm:gap-5">
            <a href={REVIEW_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 hover:text-slate-700">
              <MapPin className="h-3.5 w-3.5" /> 19/3 Poorwarama Rd, Nugegoda
            </a>
            <a href={`tel:${PHONE}`} className="inline-flex items-center gap-1.5 hover:text-slate-700">
              <Phone className="h-3.5 w-3.5" /> {PHONE}
            </a>
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] text-slate-400">SMART LABS · Nugegoda, Sri Lanka</p>
      </div>
    </main>
  );
}
