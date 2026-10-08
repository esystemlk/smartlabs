import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Building2, Scale, Target, CalendarCheck, UserPlus, Youtube,
  GraduationCap, ShieldCheck, Phone, Globe, ArrowRight, PlayCircle, Lightbulb,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'PTE Exam Preparation Guide — Videos & What to Expect | Smart Labs',
  description:
    'Get familiar with your PTE exam before test day: inside the test centre, IELTS vs PTE, booking your exam, creating your MyPTE account and more — explained with short videos from Smart Labs.',
};

interface VideoItem {
  num: number;
  icon: typeof Building2;
  title: string;
  desc: string;
  id: string;        // YouTube video id
  tint: string;      // card tint background
  badge: string;     // number badge bg
  ring: string;      // header icon ring
  accentText: string;
}

const videos: VideoItem[] = [
  {
    num: 1, icon: Building2, id: 'axkn_Piyza4',
    title: 'Inside the PTE Test Centre',
    desc: 'See what a real test centre looks like and exactly what to expect on your examination day — from check-in to your workstation.',
    tint: 'bg-blue-50 dark:bg-blue-950/30', badge: 'bg-blue-600', ring: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300', accentText: 'text-blue-700 dark:text-blue-300',
  },
  {
    num: 2, icon: Scale, id: 'G8Tb6gdKGvQ',
    title: 'IELTS vs PTE — Understanding the Exams',
    desc: 'Not sure which test is right for you? Understand the key differences between IELTS and PTE so you can prepare with confidence.',
    tint: 'bg-violet-50 dark:bg-violet-950/30', badge: 'bg-violet-600', ring: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300', accentText: 'text-violet-700 dark:text-violet-300',
  },
  {
    num: 3, icon: Target, id: 'x1B40yzyWYE',
    title: 'Additional Exam Guidance',
    desc: 'Extra tips and guidance to help you feel ready and reduce exam-day surprises.',
    tint: 'bg-emerald-50 dark:bg-emerald-950/30', badge: 'bg-emerald-600', ring: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300', accentText: 'text-emerald-700 dark:text-emerald-300',
  },
  {
    num: 4, icon: CalendarCheck, id: 'k-L-y-UUQFc',
    title: 'How to Book Your PTE Examination',
    desc: 'A clear walkthrough of the examination booking process, so you can reserve your test date without confusion.',
    tint: 'bg-amber-50 dark:bg-amber-950/30', badge: 'bg-amber-500', ring: 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300', accentText: 'text-amber-700 dark:text-amber-300',
  },
  {
    num: 5, icon: UserPlus, id: 'WX7H1rD4xi4',
    title: 'How to Create Your MyPTE Account',
    desc: 'Step-by-step help creating your MyPTE account — the first thing you need for PTE registration.',
    tint: 'bg-rose-50 dark:bg-rose-950/30', badge: 'bg-rose-500', ring: 'bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300', accentText: 'text-rose-700 dark:text-rose-300',
  },
];

export default function PteExamGuidePage() {
  return (
    <div className="w-full">
      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[#0D1B35] text-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-amber-400/10 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 py-14 sm:px-6 sm:py-20">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-black uppercase tracking-widest text-amber-300">
            <GraduationCap size={14} /> Smart Labs · PTE Exam Preparation
          </div>
          <h1 className="mt-4 max-w-3xl text-balance text-3xl font-black leading-tight sm:text-5xl">
            Get familiar with your PTE exam <span className="text-amber-300">before test day</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base">
            Preparation isn&rsquo;t just about practising questions — it&rsquo;s about knowing what to expect. Watch these
            short videos to understand the test environment, the exam procedure, and how to register with confidence.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#videos" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-900 transition-colors hover:bg-amber-300">
              <PlayCircle size={18} /> Start watching
            </a>
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-white/10">
              Explore our PTE courses <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Step overview ──────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-5xl px-5 py-10 sm:px-6">
        <h2 className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground">Your 5-step get-ready checklist</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {videos.map((v) => (
            <a key={v.num} href={`#video-${v.num}`} className={`group flex flex-col items-center gap-2 rounded-2xl border border-border ${v.tint} p-4 text-center transition-transform hover:-translate-y-0.5`}>
              <span className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${v.ring}`}><v.icon size={20} /></span>
              <span className="text-xs font-black leading-snug text-foreground">{v.title}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Videos ─────────────────────────────────────────────────────────── */}
      <section id="videos" className="mx-auto max-w-4xl space-y-8 px-5 pb-6 sm:px-6">
        {videos.map((v) => (
          <article key={v.num} id={`video-${v.num}`} className={`scroll-mt-24 overflow-hidden rounded-3xl border border-border ${v.tint}`}>
            <div className="flex items-start gap-3 p-5 sm:p-6">
              <span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white ${v.badge}`}>{v.num}</span>
              <div className="min-w-0">
                <div className={`flex items-center gap-2 text-[11px] font-black uppercase tracking-wide ${v.accentText}`}>
                  <v.icon size={14} /> Video {v.num}
                </div>
                <h3 className="mt-1 text-lg font-black text-foreground sm:text-xl">{v.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{v.desc}</p>
              </div>
            </div>
            <div className="px-5 pb-5 sm:px-6 sm:pb-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${v.id}`}
                  title={v.title}
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              </div>
            </div>
          </article>
        ))}
      </section>

      {/* ── Important reminder ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-4xl px-5 pb-10 sm:px-6">
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
            <ShieldCheck size={20} />
            <h2 className="text-lg font-black">Important reminder</h2>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-relaxed text-amber-900 dark:text-amber-100/90">
            <li className="flex items-start gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0" /> Please watch these videos <b>before</b> booking your examination.</li>
            <li className="flex items-start gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0" /> Make sure you understand the examination procedures and what happens on test day.</li>
            <li className="flex items-start gap-2"><Lightbulb size={16} className="mt-0.5 shrink-0" /> Always use the official <b>Pearson PTE</b> website to confirm current registration requirements.</li>
          </ul>
          <p className="mt-4 text-sm font-semibold text-amber-800 dark:text-amber-200">
            Remember — preparation isn&rsquo;t just about practising questions. It&rsquo;s about knowing what to expect on examination day!
          </p>
        </div>
      </section>

      {/* ── CTA / contact ──────────────────────────────────────────────────── */}
      <section className="bg-[#0D1B35] text-white">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 px-5 py-12 text-center sm:px-6">
          <GraduationCap size={30} className="text-amber-300" />
          <h2 className="text-2xl font-black">Ready to start your PTE journey?</h2>
          <p className="max-w-xl text-sm text-white/70">Join a Smart Labs PTE class and get expert guidance, strategies and feedback all the way to test day.</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/courses" className="inline-flex items-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 text-sm font-black text-slate-900 hover:bg-amber-300">View PTE courses <ArrowRight size={16} /></Link>
            <a href="tel:0706914652" className="inline-flex items-center gap-2 rounded-2xl border border-white/20 px-5 py-3 text-sm font-black text-white hover:bg-white/10"><Phone size={16} /> 070 691 4652</a>
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-white/50"><Globe size={13} /> www.smartlabs.lk · <Youtube size={13} /> Smarter English. Brighter Futures.</p>
        </div>
      </section>
    </div>
  );
}
