import type { Metadata } from 'next';
import Link from 'next/link';
import {
  CalendarDays, Clock, Timer, Tag, CheckCircle2, Users, MessageSquare,
  Target, Lightbulb, Sparkles, ArrowRight, AlertTriangle, Phone,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Feedback Club — Weekly Expert PTE Feedback Sessions',
  description:
    'The Smart Labs Feedback Club: weekly live sessions where Academic Mentors review your PTE responses and give detailed feedback. Every Saturday · LKR 5,000 per session · advance booking required.',
};

const gains = [
  'Expert feedback on selected student responses',
  'Practical strategies to improve your performance',
  'Clear explanations of common mistakes',
  'Ask questions related to the session topic',
  'Insights from reviewing real student responses',
  'Continuous motivation and guidance throughout your prep',
];

const details = [
  { icon: CalendarDays, label: 'Every Saturday', sub: 'Weekly session' },
  { icon: Clock, label: '12:30 – 2:00 PM', sub: 'Live class' },
  { icon: Timer, label: '1 – 1.5 hours', sub: 'Duration' },
  { icon: Tag, label: 'LKR 5,000', sub: 'Per session' },
];

const info = [
  { icon: MessageSquare, title: 'Submit before the session', text: 'Send your responses in advance so mentors can review selected ones live.' },
  { icon: Target, title: 'Focused each week', text: 'Every session focuses on selected PTE question types.' },
  { icon: Users, title: 'Small groups', text: 'Limited seats keep the discussion interactive and meaningful.' },
  { icon: Lightbulb, title: 'Learn from real examples', text: 'Feedback on real student responses benefits everyone in the room.' },
];

export default function FeedbackClubPage() {
  return (
    <div className="w-full">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
        <div className="pointer-events-none absolute -right-16 -top-16 h-72 w-72 rounded-full bg-primary/10 blur-[120px]" />
        <div className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-accent-1/10 blur-[120px]" />
        <div className="container relative mx-auto px-4 py-16 md:py-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Smart Labs Feedback Club
          </span>
          <h1 className="mt-5 max-w-3xl text-3xl font-black leading-tight md:text-5xl">
            Practise with confidence. Improve with feedback. <span className="gradient-text">Achieve your target score.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
            A dedicated weekly session for PTE learners to get expert feedback, ask questions, and learn from real
            examples — so you keep improving right up until exam day.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              Reserve Your Seat <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="tel:0774533233" className="inline-flex items-center gap-2 rounded-xl border border-border px-6 py-3 text-sm font-semibold text-foreground hover:bg-muted">
              <Phone className="h-4 w-4" /> 077 453 3233
            </a>
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="py-14 md:py-16">
        <div className="container mx-auto grid gap-10 px-4 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-black md:text-3xl">Learning doesn’t end when your course finishes</h2>
            <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted-foreground md:text-base">
              <p>
                Many PTE candidates delay their exam due to work commitments, university studies, visa processes, or
                personal responsibilities. During this time they keep practising independently — but often struggle
                with one important question:
              </p>
              <p className="rounded-xl border-l-4 border-primary bg-primary/5 px-4 py-3 text-base font-semibold text-foreground">
                “Am I practising the right way?”
              </p>
              <p>
                Without expert guidance, it’s easy to develop incorrect habits, lose confidence, and miss chances to
                improve. The Feedback Club provides <b>continuous academic support</b> for students who want to keep
                improving before their exam.
              </p>
              <p>
                Each week, our Academic Mentors host an interactive live session on selected PTE question types.
                Students submit their responses beforehand, and mentors review selected submissions with detailed
                feedback during the live discussion — a collaborative experience where everyone benefits.
              </p>
            </div>
          </div>

          {/* What you'll gain */}
          <div className="rounded-2xl border bg-card p-6 md:p-7">
            <h3 className="text-lg font-bold">What you’ll gain</h3>
            <ul className="mt-4 space-y-3">
              {gains.map((g) => (
                <li key={g} className="flex gap-2.5 text-sm">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> <span>{g}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/30 py-14 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-black md:text-3xl">How it works</h2>
            <p className="mt-2 text-muted-foreground">A live, online, interactive session — every week.</p>
          </div>
          <div className="mx-auto grid max-w-4xl grid-cols-2 gap-3 md:grid-cols-4">
            {details.map((d) => (
              <div key={d.label} className="rounded-2xl border bg-card p-5 text-center">
                <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><d.icon className="h-5 w-5" /></div>
                <p className="font-bold">{d.label}</p>
                <p className="text-xs text-muted-foreground">{d.sub}</p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-6 grid max-w-4xl gap-3 sm:grid-cols-2">
            {info.map((i) => (
              <div key={i.title} className="flex gap-3 rounded-xl border bg-card p-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary"><i.icon className="h-4 w-4" /></div>
                <div>
                  <p className="text-sm font-semibold">{i.title}</p>
                  <p className="text-xs text-muted-foreground">{i.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Limited seats / CTA */}
      <section className="py-14 md:py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary to-purple-600 p-8 text-center text-white md:p-12">
            <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest">
              <AlertTriangle className="h-3.5 w-3.5" /> Limited seats · Advance booking required
            </div>
            <h2 className="text-2xl font-black md:text-3xl">Reserve your seat and take the next step</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-white/80">
              To keep the experience high-quality and interactive, each session is limited to a small number of
              participants. Book in advance to secure your place.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contact" className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-bold text-primary hover:bg-white/90">
                Reserve Your Seat <ArrowRight className="h-4 w-4" />
              </Link>
              <a href="tel:0774533233" className="inline-flex items-center gap-2 rounded-xl border border-white/30 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">
                <Phone className="h-4 w-4" /> Call to book
              </a>
            </div>
            <p className="mt-4 text-xs text-white/70">Learn. Discuss. Improve. Together we grow stronger.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
