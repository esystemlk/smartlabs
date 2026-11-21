'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Loader2, Video, MapPin, Clock, CalendarCheck, ShieldCheck } from 'lucide-react';
import { useUser } from '@/firebase';
import { payhereUrls } from '@/lib/payhere';
import { otoApi, fmtDate, CancellationPolicy } from '@/components/one-to-one/shared';
import { fmtTime, lkr, priceFor, HOUR_OPTIONS, type OtoLecturer, type OtoMode } from '@/lib/one-to-one';

type Day = { date: string; starts: number[] };

export default function OneToOnePage() {
  const { user } = useUser();
  const router = useRouter();
  const [lecturers, setLecturers] = useState<OtoLecturer[] | null>(null);
  const [cfg, setCfg] = useState({ cooldownMin: 30, holdMin: 15 });
  const [rev, setRev] = useState(0);
  const [loadError, setLoadError] = useState('');
  const [pick, setPick] = useState<{ lecturer: OtoLecturer; mode: OtoMode; hours: number } | null>(null);
  const [days, setDays] = useState<Day[] | null>(null);
  const [date, setDate] = useState('');
  const [start, setStart] = useState<number | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState('');
  const [payment, setPayment] = useState<Record<string, string> | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    otoApi<{ lecturers: OtoLecturer[]; settings: { cooldownMin: number; holdMin: number } }>(null, 'lecturers')
      .then(d => { setLecturers(d.lecturers); setCfg(d.settings); })
      .catch(e => setLoadError(e.message));
  }, []);
  useEffect(() => { if (payment && formRef.current) formRef.current.submit(); }, [payment]);

  // Reload open times whenever lecturer / length changes.
  useEffect(() => {
    if (!pick) return;
    setDays(null); setStart(null); setError('');
    otoApi<{ days: Day[] }>(null, `slots?lecturer=${pick.lecturer.id}&hours=${pick.hours}`)
      .then(d => { setDays(d.days); setDate(cur => d.days.some(x => x.date === cur) ? cur : d.days[0]?.date ?? ''); })
      .catch(e => setError(e.message));
  }, [pick?.lecturer.id, pick?.hours, rev]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (l: OtoLecturer) => {
    setPick({ lecturer: l, mode: l.modes[0], hours: 1 });
    setTimeout(() => panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const book = async () => {
    if (!pick || start === null) return;
    if (!user) { router.push('/login?redirect=/one-to-one'); return; }
    setPaying(true); setError('');
    try {
      const r = await otoApi<{ params: Record<string, string> }>(user, 'book', { lecturerId: pick.lecturer.id, mode: pick.mode, hours: pick.hours, date, startMin: start, agreed });
      setPayment(r.params);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Please try again.');
      setPaying(false);
      setRev(r => r + 1); // the slot may have just been taken
    }
  };

  const rate = pick ? priceFor(pick.lecturer, pick.mode) : 0;
  const dayStarts = days?.find(d => d.date === date)?.starts ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28 text-slate-900">
      <form ref={formRef} method="post" action={payhereUrls.checkout} className="hidden">
        {Object.entries(payment ?? {}).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      <div className="mx-auto max-w-6xl space-y-10">
        <section className="text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-primary">SmartLabs private coaching</p>
          <h1 className="mt-2 text-4xl font-black tracking-tight md:text-5xl">One-to-One Sessions</h1>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">Book a private 1, 2 or 3 hour session with a SmartLabs lecturer — online on Zoom or in person. Pick your lecturer, choose an open time and pay securely.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/one-to-one/my-bookings" className="inline-flex items-center gap-2 rounded-xl border bg-white px-4 py-2 text-sm font-bold"><CalendarCheck size={16} />My bookings</Link>
          </div>
        </section>

        <section aria-labelledby="oto-lecturers">
          <h2 id="oto-lecturers" className="mb-4 text-xl font-black">Our lecturers</h2>
          {loadError && <p className="text-rose-700">{loadError}</p>}
          {!lecturers && !loadError && <Loader2 className="mx-auto h-6 w-6 animate-spin" />}
          {lecturers?.length === 0 && <p className="rounded-2xl border bg-white p-6 text-center text-slate-600">Lecturers will be listed here soon.</p>}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {lecturers?.map(l => (
              <article key={l.id} className={`flex flex-col overflow-hidden rounded-2xl border bg-white ${pick?.lecturer.id === l.id ? 'ring-2 ring-primary' : ''}`}>
                {l.photoUrl ? <img src={l.photoUrl} alt={`Photo of ${l.name}`} className="aspect-[4/3] w-full object-cover" /> : <div className="aspect-[4/3] w-full bg-slate-200" />}
                <div className="flex flex-1 flex-col p-5">
                  <h3 className="text-lg font-black">{l.name}</h3>
                  {l.title && <p className="text-sm font-semibold text-primary">{l.title}</p>}
                  {l.subjects.length > 0 && <p className="mt-2 flex flex-wrap gap-1">{l.subjects.map(s => <span key={s} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{s}</span>)}</p>}
                  {l.bio && <p className="mt-3 line-clamp-4 text-sm text-slate-600">{l.bio}</p>}
                  <dl className="mt-4 space-y-1 text-sm">
                    {l.modes.includes('online') && <div className="flex justify-between"><dt><Video size={14} className="mr-1 inline" />Online (Zoom)</dt><dd className="font-bold">{lkr(l.priceOnline ?? 0)} / hour</dd></div>}
                    {l.modes.includes('physical') && <div className="flex justify-between"><dt><MapPin size={14} className="mr-1 inline" />Physical class</dt><dd className="font-bold">{lkr(l.pricePhysical ?? 0)} / hour</dd></div>}
                  </dl>
                  <button className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:opacity-90" onClick={() => choose(l)}>
                    Book with {l.name.split(' ')[0]}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        {pick && (
          <section ref={panelRef} aria-labelledby="oto-book" className="scroll-mt-28 rounded-3xl border bg-white p-5 md:p-8">
            <h2 id="oto-book" className="text-2xl font-black">Book with {pick.lecturer.name}</h2>
            <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                {pick.lecturer.modes.length > 1 && (
                  <fieldset><legend className="mb-2 text-sm font-bold">1. Session type</legend>
                    <div className="flex flex-wrap gap-2">
                      {pick.lecturer.modes.map(m => (
                        <button key={m} aria-pressed={pick.mode === m} onClick={() => setPick({ ...pick, mode: m })}
                          className={`rounded-xl border px-4 py-2 text-sm font-semibold ${pick.mode === m ? 'border-primary bg-primary text-primary-foreground' : 'bg-white'}`}>
                          {m === 'online' ? 'Online (Zoom)' : 'Physical class'} · {lkr(priceFor(pick.lecturer, m))}/h
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
                <fieldset><legend className="mb-2 text-sm font-bold">{pick.lecturer.modes.length > 1 ? '2' : '1'}. How many hours?</legend>
                  <div className="flex gap-2">
                    {HOUR_OPTIONS.map(h => (
                      <button key={h} aria-pressed={pick.hours === h} onClick={() => setPick({ ...pick, hours: h })}
                        className={`rounded-xl border px-5 py-2 text-sm font-semibold ${pick.hours === h ? 'border-primary bg-primary text-primary-foreground' : 'bg-white'}`}>
                        {h} hour{h > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset><legend className="mb-2 text-sm font-bold">Choose a date</legend>
                  {!days ? <Loader2 className="h-5 w-5 animate-spin" /> : days.length === 0
                    ? <p className="rounded-xl bg-slate-100 p-4 text-sm text-slate-600">No open {pick.hours}-hour times right now. Try a shorter session or check back soon.</p>
                    : <div className="flex gap-2 overflow-x-auto pb-2">
                        {days.map(d => (
                          <button key={d.date} aria-pressed={date === d.date} onClick={() => { setDate(d.date); setStart(null); }}
                            className={`shrink-0 rounded-xl border px-4 py-2 text-center text-sm ${date === d.date ? 'border-primary bg-primary text-primary-foreground' : 'bg-white'}`}>
                            <span className="block font-bold">{fmtDate(d.date, { weekday: 'short' })}</span>{fmtDate(d.date, { day: 'numeric', month: 'short' })}
                          </button>
                        ))}
                      </div>}
                </fieldset>
                {days && days.length > 0 && (
                  <fieldset><legend className="mb-1 text-sm font-bold">Choose a start time <span className="font-normal text-slate-500">(Sri Lanka time)</span></legend>
                    <p className="mb-2 text-xs text-slate-500">A {cfg.cooldownMin}-minute break is kept between sessions, so times right after another booking are not shown.</p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {dayStarts.map(s => (
                        <button key={s} aria-pressed={start === s} onClick={() => setStart(s)}
                          className={`rounded-xl border px-2 py-2 text-sm font-semibold ${start === s ? 'border-primary bg-primary text-primary-foreground' : 'bg-white hover:border-primary'}`}>
                          {fmtTime(s)}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                )}
              </div>

              <aside className="space-y-4 rounded-2xl bg-slate-50 p-5">
                <h3 className="font-black">Your booking</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between"><dt>Lecturer</dt><dd className="font-semibold">{pick.lecturer.name}</dd></div>
                  <div className="flex justify-between"><dt>Type</dt><dd className="font-semibold">{pick.mode === 'online' ? 'Online (Zoom)' : 'Physical class'}</dd></div>
                  <div className="flex justify-between"><dt>When</dt><dd className="text-right font-semibold">{start !== null ? <>{fmtDate(date)}<br />{fmtTime(start)} – {fmtTime(start + pick.hours * 60)}</> : '—'}</dd></div>
                  <div className="flex justify-between"><dt>Rate</dt><dd>{lkr(rate)} × {pick.hours} h</dd></div>
                  <div className="flex justify-between border-t pt-2 text-base"><dt className="font-bold">Total</dt><dd className="font-black">{lkr(rate * pick.hours)}</dd></div>
                </dl>
                <p className="flex gap-2 text-xs text-slate-600"><Clock size={14} className="shrink-0" />{pick.mode === 'online' ? 'Your Zoom link appears in My bookings 30 minutes before the session.' : 'The class address appears in My bookings 30 minutes before the session.'}</p>
                <CancellationPolicy compact />
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" className="mt-1" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
                  <span>I have read and agree to the cancellation &amp; refund policy.</span>
                </label>
                {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
                <button className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50"
                  disabled={start === null || !agreed || paying || rate <= 0} onClick={() => void book()}>
                  {paying ? 'Opening secure checkout…' : !user ? 'Sign in to book' : `Pay ${lkr(rate * pick.hours)}`}
                </button>
                <p className="flex items-center justify-center gap-1 text-xs text-slate-500"><ShieldCheck size={14} />Secure payment through PayHere. Your slot is held for {cfg.holdMin} minutes while you pay.</p>
              </aside>
            </div>
          </section>
        )}

        <CancellationPolicy />
      </div>
    </main>
  );
}
