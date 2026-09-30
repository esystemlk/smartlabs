import Link from 'next/link';
import type { Metadata } from 'next';
import {
  Handshake, UserPlus, Send, BadgeCheck, LayoutDashboard, Mail, ArrowRight,
  Building2, User, ShieldCheck, LineChart,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Become a Partner — SmartLabs Referral Programme',
  description:
    'Refer students to SmartLabs and track their progress. Businesses and individuals can apply to join the SmartLabs referral partner programme.',
};

const HOW_IT_WORKS = [
  { icon: UserPlus, title: 'Apply', body: 'Choose Business or Individual and create your partner account with a username, email and password.' },
  { icon: Send, title: 'Get approved', body: 'Our team reviews your application. You can sign in any time to check your status while it is pending.' },
  { icon: Handshake, title: 'Refer students', body: 'Once approved, use your partner workspace and referral link to send students to SmartLabs.' },
  { icon: LineChart, title: 'Track progress', body: 'Follow each referral from first contact through to enrolment, right inside your workspace.' },
];

const WHO = [
  { icon: Building2, title: 'Businesses', body: 'Agencies, institutes, tuition centres and companies that work with students preparing for PTE, IELTS and more. Approved business logos can appear on our homepage.' },
  { icon: User, title: 'Individuals', body: 'Teachers, counsellors, alumni and community members who can recommend SmartLabs to learners.' },
];

const FAQ = [
  { q: 'How do I access the partner workspace?', a: 'After you apply and your email is verified, sign in at the partner login. Approved partners get the full workspace; pending applicants see their application status.' },
  { q: 'Is the partner area separate from the student dashboard?', a: 'Yes. Partners have their own dedicated workspace and never use the student learning dashboard.' },
  { q: 'What can I see about my referrals?', a: 'You can track the status, course and submission date of your own referrals, plus a limited progress note. Other partners’ data and internal notes are never shown.' },
  { q: 'How are questions handled?', a: 'Email contact@smartlabs.lk any time — we’re happy to help with your application or partnership.' },
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20 text-center">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-blue-600">
            <Handshake size={14} /> Referral Partner Programme
          </div>
          <h1 className="mx-auto max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Partner with SmartLabs. Refer students. Grow together.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-slate-600 sm:text-lg">
            Join our referral programme to recommend students to SmartLabs and follow their journey
            from first contact to enrolment — all from your own partner workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/partners/register"
              className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-black text-white transition-colors hover:bg-slate-800"
            >
              <UserPlus size={18} /> Apply to Become a Partner
            </Link>
            <Link
              href="/partners/login"
              className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-300 px-7 py-3.5 text-sm font-black text-slate-800 transition-colors hover:border-slate-900"
            >
              <LayoutDashboard size={18} /> Partner Login
            </Link>
          </div>
        </div>
      </section>

      {/* Who can apply */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <h2 className="text-center text-2xl font-black sm:text-3xl">Who can apply</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {WHO.map((w) => (
            <div key={w.title} className="rounded-3xl border border-slate-200 p-6 sm:p-8">
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <w.icon size={22} />
              </div>
              <h3 className="text-lg font-black">{w.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{w.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-black sm:text-3xl">How referrals work</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HOW_IT_WORKS.map((s, i) => (
              <div key={s.title} className="relative rounded-3xl border border-slate-200 bg-white p-6">
                <span className="absolute right-5 top-5 text-3xl font-black text-slate-100">{i + 1}</span>
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-white">
                  <s.icon size={20} />
                </div>
                <h3 className="text-base font-black">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Approval + trust */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <div className="grid gap-6 rounded-3xl border border-slate-200 p-6 sm:grid-cols-2 sm:p-10">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-blue-600"><BadgeCheck size={18} /><span className="text-xs font-black uppercase tracking-widest">Approval process</span></div>
            <p className="text-sm leading-relaxed text-slate-600">
              Every application is reviewed by our team. You’ll get an email acknowledgement with a
              reference number as soon as you apply, and you can sign in to check your status. Full
              referral features unlock once your email is verified and your partnership is approved.
            </p>
          </div>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 text-blue-600"><ShieldCheck size={18} /><span className="text-xs font-black uppercase tracking-widest">Your data is protected</span></div>
            <p className="text-sm leading-relaxed text-slate-600">
              Partners only ever see their own referrals and profile. We ask for student consent
              before you share their contact details, and we never expose other partners’ data.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
          <h2 className="text-center text-2xl font-black sm:text-3xl">Frequently asked questions</h2>
          <div className="mt-8 space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-2xl border border-slate-200 bg-white p-5">
                <summary className="cursor-pointer list-none text-sm font-black text-slate-900">{f.q}</summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h2 className="text-2xl font-black sm:text-3xl">Ready to partner with us?</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-slate-600">
          Apply today, or reach out with any questions.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link href="/partners/register" className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-7 py-3.5 text-sm font-black text-white hover:bg-blue-700">
            Apply to Become a Partner <ArrowRight size={16} />
          </Link>
          <a href="mailto:contact@smartlabs.lk" className="inline-flex items-center gap-2 rounded-2xl border-2 border-slate-300 px-7 py-3.5 text-sm font-black text-slate-800 hover:border-slate-900">
            <Mail size={16} /> contact@smartlabs.lk
          </a>
        </div>
      </section>
    </div>
  );
}
