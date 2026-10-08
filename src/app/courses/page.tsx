import Link from 'next/link';
import type { Metadata } from 'next';
import { PTE_PACKAGES, formatLkr } from '@/lib/pte-packages';
import { IELTS_COURSE } from '@/lib/ielts-course';
import { ArrowRight, Clock, MapPin, Monitor, Video, GraduationCap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Courses & Fees | Smart Labs',
  description: 'PTE and IELTS courses at Smart Labs — online and physical classes, class recordings. Register and pay online.',
};

interface Card {
  name: string; price: number; href: string; tagline: string;
  mode?: string; schedule?: string; duration?: string; badge?: string; cta?: string;
}

const pte = (id: string): Card | null => {
  const p = PTE_PACKAGES.find((x) => x.id === id);
  if (!p) return null;
  return {
    name: p.name, price: p.price, href: `/pte-registration?package=${p.id}`, tagline: p.tagline,
    mode: p.mode === 'physical' ? 'Physical · Nugegoda' : p.mode === 'online' ? 'Online · Live' : 'Online · Live',
    schedule: p.schedule, duration: p.durationLabel ?? p.hoursLabel, badge: p.popular ? 'Popular' : undefined,
  };
};

export default function CoursesPage() {
  const onlineTiers = ['boostify', 'boostify_plus', 'hybrid_boostify_pro'].map(pte).filter(Boolean) as Card[];
  const night = pte('boostify_night');
  const physical = pte('physical_mastery');

  const ielts: Card = {
    name: IELTS_COURSE.name, price: IELTS_COURSE.price, href: '/ielts-registration', tagline: IELTS_COURSE.tagline,
    mode: 'Online · Live', duration: IELTS_COURSE.durationLabel, cta: 'Register & pay',
  };
  const recordings: Card = {
    name: 'Class Recordings', price: 20000, href: '/dashboard/recordings', tagline: 'Rewatch recent class recordings on your own schedule.',
    mode: 'Self-paced', duration: 'Watch access', cta: 'Browse recordings',
  };

  const ModeIcon = ({ mode }: { mode?: string }) =>
    mode?.startsWith('Physical') ? <MapPin size={13} /> : mode === 'Self-paced' ? <Video size={13} /> : <Monitor size={13} />;

  const CardTile = ({ c }: { c: Card }) => (
    <div className="relative flex flex-col rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
      {c.badge && <span className="absolute right-4 top-4 rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wide text-slate-900">{c.badge}</span>}
      <h3 className="pr-16 text-lg font-black text-slate-900">{c.name}</h3>
      <p className="mt-1 text-sm text-slate-500">{c.tagline}</p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs font-bold text-slate-500">
        {c.mode && <span className="inline-flex items-center gap-1"><ModeIcon mode={c.mode} /> {c.mode}</span>}
        {c.schedule && <span className="inline-flex items-center gap-1"><Clock size={13} /> {c.schedule}</span>}
        {c.duration && <span className="inline-flex items-center gap-1"><GraduationCap size={13} /> {c.duration}</span>}
      </div>
      <div className="mt-5 flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
        <div><div className="text-2xl font-black text-slate-900">{formatLkr(c.price)}</div></div>
        <Link href={c.href} className="inline-flex items-center gap-1.5 rounded-2xl bg-blue-600 px-4 py-2.5 text-sm font-black text-white hover:bg-blue-700">{c.cta ?? 'Register'} <ArrowRight size={15} /></Link>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-8 text-center">
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">Courses &amp; Fees</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900 sm:text-4xl">Choose your class</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">Register and pay online. Batch details are shared by email and WhatsApp after you register.</p>
      </header>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">PTE — Online (Afternoon · 2:30–4:30 PM tiers)</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{onlineTiers.map((c) => <CardTile key={c.name} c={c} />)}</div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">PTE — More options</h2>
        <div className="grid gap-4 sm:grid-cols-2">{[night, physical].filter(Boolean).map((c) => <CardTile key={(c as Card).name} c={c as Card} />)}</div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-slate-400">IELTS &amp; Recordings</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <CardTile c={ielts} />
          <CardTile c={recordings} />
        </div>
      </section>

      <p className="mt-10 text-center text-xs text-slate-400">Questions? Call 070 691 4652 / 077 453 3233 · www.smartlabs.lk</p>
    </div>
  );
}
