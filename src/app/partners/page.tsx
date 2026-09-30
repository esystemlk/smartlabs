import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Handshake, UserPlus, Send, BadgeCheck, LayoutDashboard, Mail, ArrowRight,
  Building2, User, ShieldCheck, LineChart, TrendingUp, RefreshCw, Wallet, CheckCircle2,
} from 'lucide-react';
import { CommissionTiers } from '@/components/partners/commission-tiers';

export const metadata: Metadata = {
  title: 'Become a Partner — SmartLabs Referral Programme',
  description:
    'Refer students to SmartLabs and earn tiered commission up to 15%. Businesses and individuals can join the SmartLabs referral partner programme and track every referral from their own workspace.',
};

const HIGHLIGHTS = [
  { icon: TrendingUp, title: 'Up to 15% commission', body: 'Tiered rewards that grow as you refer more students each month.' },
  { icon: RefreshCw, title: 'Resets every month', body: 'A fresh start each month — reach the top tier again and again.' },
  { icon: Wallet, title: 'Transparent tracking', body: 'Follow every referral and estimated earning from your workspace.' },
];

const HOW_IT_WORKS = [
  { icon: UserPlus, title: 'Apply', body: 'Choose Business or Individual and create your partner account with a username, email and password.' },
  { icon: Send, title: 'Get approved', body: 'Our team reviews your application. You can sign in any time to check your status while it is pending.' },
  { icon: Handshake, title: 'Refer students', body: 'Once approved, use your partner workspace and referral link to send students to SmartLabs.' },
  { icon: LineChart, title: 'Earn & track', body: 'Follow each referral from first contact to enrolment — and watch your commission tier climb.' },
];

const WHO = [
  { icon: Building2, title: 'Businesses', body: 'Agencies, institutes, tuition centres and companies that work with students preparing for PTE, IELTS and more. Approved business logos can appear on our homepage.' },
  { icon: User, title: 'Individuals', body: 'Teachers, counsellors, alumni and community members who can recommend SmartLabs to learners.' },
];

const FAQ = [
  { q: 'How does the tiered commission work?', a: 'Each month you earn 10% on your first 10 referred enrolments, 12% on the 11th–20th, and 15% from the 21st onward. The bracket rate applies within each band, and your tier resets at the start of every month.' },
  { q: 'How do I access the partner workspace?', a: 'After you apply and your email is verified, sign in at the partner login. Approved partners get the full workspace; pending applicants see their application status.' },
  { q: 'Is the partner area separate from the student dashboard?', a: 'Yes. Partners have their own dedicated workspace and never use the student learning dashboard.' },
  { q: 'What can I see about my referrals?', a: 'You can track the status, course and submission date of your own referrals, plus a limited progress note. Other partners’ data and internal notes are never shown.' },
  { q: 'How are questions handled?', a: 'Email contact@smartlabs.lk any time — we’re happy to help with your application or partnership.' },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-b from-blue-50/70 via-white to-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.5]"
          style={{ background: 'radial-gradient(45% 40% at 85% 0%, rgba(99,102,241,.18), transparent 70%), radial-gradient(40% 40% at 0% 20%, rgba(16,185,129,.12), transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/70 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-600 backdrop-blur">
            <Handshake size={14} /> Referral Partner Programme
          </div>
          <h1 className="mx-auto max-w-3xl text-4xl font-black leading-[1.05] tracking-tight sm:text-6xl">
            Refer students.{' '}
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 bg-clip-text text-transparent">
              Earn up to 15%.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-slate-600 sm:text-lg">
            Join the SmartLabs partner programme to recommend students, earn tiered commission that grows
            as you refer more, and track every referral from your own professional workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/partners/register" className="group inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition-all hover:-translate-y-0.5 hover:bg-slate-800">
              <UserPlus size={18} /> Apply to Become a Partner
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/partners/login" className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white/60 px-7 py-3.5 text-sm font-black text-slate-800 backdrop-blur transition-colors hover:border-slate-900">
              <LayoutDashboard size={18} /> Partner Login
            </Link>
          </div>

          {/* Highlight strip */}
          <div className="mx-auto mt-14 grid max-w-4xl gap-4 sm:grid-cols-3">
            {HIGHLIGHTS.map((h) => (
              <div key={h.title} className="rounded-3xl border border-slate-200 bg-white/80 p-6 text-left shadow-sm backdrop-blur">
                <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><h.icon size={20} /></div>
                <div className="text-sm font-black text-slate-900">{h.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{h.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tiered commission (dark, striking) ───────────────────────────── */}
      <CommissionTiers />

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="text-center">
          <h2 className="text-2xl font-black sm:text-3xl">How referrals work</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">Four simple steps from applying to earning.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map((s, i) => (
            <div key={s.title} className="group relative rounded-3xl border border-slate-200 bg-white p-6 transition-all hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg">
              <span className="absolute right-5 top-4 text-4xl font-black text-slate-100 transition-colors group-hover:text-blue-100">{i + 1}</span>
              <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
                <s.icon size={20} />
              </div>
              <h3 className="text-base font-black">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Who can apply ────────────────────────────────────────────────── */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="text-center">
            <h2 className="text-2xl font-black sm:text-3xl">Who can apply</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">Two ways to partner with SmartLabs.</p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2">
            {WHO.map((w) => (
              <div key={w.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><w.icon size={22} /></div>
                <h3 className="text-lg font-black">{w.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Approval + trust ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-3 inline-flex items-center gap-2 text-blue-600"><BadgeCheck size={20} /><span className="text-xs font-black uppercase tracking-widest">Approval process</span></div>
            <p className="text-sm leading-relaxed text-slate-600">
              Every application is reviewed by our team. You’ll get an email acknowledgement with a
              reference number as soon as you apply, and you can sign in to check your status. Full
              referral features unlock once your email is verified and your partnership is approved.
            </p>
            <ul className="mt-4 space-y-2">
              {['Instant acknowledgement email', 'Track status from your workspace', 'Resubmit easily if we need more info'].map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><CheckCircle2 size={16} className="text-emerald-500" /> {x}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
            <div className="mb-3 inline-flex items-center gap-2 text-blue-600"><ShieldCheck size={20} /><span className="text-xs font-black uppercase tracking-widest">Your data is protected</span></div>
            <p className="text-sm leading-relaxed text-slate-600">
              Partners only ever see their own referrals and profile. We ask for student consent before
              you share their contact details, and we never expose other partners’ data.
            </p>
            <ul className="mt-4 space-y-2">
              {['Only your own referrals are visible', 'Student consent is always required', 'Internal notes stay private'].map((x) => (
                <li key={x} className="flex items-center gap-2 text-sm font-semibold text-slate-700"><CheckCircle2 size={16} className="text-emerald-500" /> {x}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-5 [&_summary::-webkit-details-marker]:hidden">
                <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-black text-slate-900">
                  {f.q}
                  <ArrowRight size={16} className="shrink-0 text-slate-400 transition-transform group-open:rotate-90" />
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(50% 60% at 50% 100%, rgba(59,130,246,.3), transparent 70%)' }} />
        <div className="relative mx-auto max-w-3xl px-4 py-20 text-center sm:px-6">
          <h2 className="text-3xl font-black sm:text-4xl">Ready to start earning?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-slate-300 sm:text-base">
            Apply today and reach the 15% top tier this month. Have a question first? We’re one email away.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link href="/partners/register" className="inline-flex items-center gap-2 rounded-2xl bg-white px-7 py-3.5 text-sm font-black text-slate-900 transition-transform hover:-translate-y-0.5">
              Apply to Become a Partner <ArrowRight size={16} />
            </Link>
            <a href="mailto:contact@smartlabs.lk" className="inline-flex items-center gap-2 rounded-2xl border-2 border-white/20 px-7 py-3.5 text-sm font-black text-white hover:border-white/50">
              <Mail size={16} /> contact@smartlabs.lk
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
