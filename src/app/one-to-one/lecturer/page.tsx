'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, CalendarClock, Users, Wallet } from 'lucide-react';
import { useUser } from '@/firebase';
import { otoApi, fmtDate, STATUS_LABEL, STATUS_TONE, AvailabilityEditor, JoinBox, type Window } from '@/components/one-to-one/shared';
import { fmtTime, lkr, type OtoLecturer } from '@/lib/one-to-one';

type Session = { id: string; studentName: string; studentPhone: string; mode: string; hours: number; date: string; startMin: number; endMin: number; startAt: number; endAt: number; status: string };
type Earning = { key: string; month: string; sessions: number; hours: number; amount: number; paidAmount: number };
type Data = { lecturer: OtoLecturer; payRate: number; availability: Window[]; sessions: Session[]; earnings: Earning[]; now: number };

export default function LecturerPortal() {
  const { user, isUserLoading } = useUser();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<{ msg: string; code?: string } | null>(null);
  const [offset, setOffset] = useState(0);

  const load = useCallback(async () => {
    if (!user) return;
    try { const d = await otoApi<Data>(user, 'lecturer'); setData(d); setOffset(d.now - Date.now()); setError(null); }
    catch (e) { setError({ msg: e instanceof Error ? e.message : 'Failed', code: (e as { code?: string }).code }); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);

  if (isUserLoading) return <Shell><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Shell>;
  if (!user) return <Shell><p>Please <Link className="font-bold underline" href="/login?redirect=/one-to-one/lecturer">sign in</Link> with your lecturer account.</p></Shell>;
  if (error) return <Shell><p className="text-rose-700">{error.code === 'NOT_LECTURER' ? 'This account is not linked to a lecturer profile yet. Ask the SmartLabs admin to link your email.' : error.msg}</p></Shell>;
  if (!data) return <Shell><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Shell>;

  const upcoming = data.sessions.filter(s => s.status === 'confirmed' && s.endAt >= data.now);
  const past = data.sessions.filter(s => !(s.status === 'confirmed' && s.endAt >= data.now)).reverse();

  return (
    <Shell>
      <header className="flex items-center gap-4">
        {data.lecturer.photoUrl && <img src={data.lecturer.photoUrl} alt="" className="h-16 w-16 rounded-2xl object-cover" />}
        <div><h1 className="text-2xl font-black">Lecturer portal</h1><p className="text-sm text-slate-600">{data.lecturer.name} · one-to-one sessions</p></div>
      </header>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-1 flex items-center gap-2 font-bold"><CalendarClock size={18} />My availability</h2>
        <p className="mb-4 text-sm text-slate-600">Add the times you can teach (Sri Lanka time). Students book 1–3 hour sessions inside these windows, with a 30-minute break kept between sessions.</p>
        <AvailabilityEditor windows={data.availability}
          onAdd={async v => { await otoApi(user, 'lecturer', { action: 'add', ...v }); await load(); }}
          onRemove={async id => { await otoApi(user, 'lecturer', { action: 'remove', id }); await load(); }} />
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Users size={18} />Upcoming sessions</h2>
        {upcoming.length === 0 ? <p className="text-sm text-slate-500">No upcoming sessions.</p> : (
          <ul className="space-y-3">
            {upcoming.map(s => (
              <li key={s.id} className="space-y-2 rounded-xl border p-3 text-sm">
                <p><strong>{fmtDate(s.date, { weekday: 'long', day: 'numeric', month: 'short' })}</strong> · {fmtTime(s.startMin)} – {fmtTime(s.endMin)} · {s.hours} h · <span className="capitalize">{s.mode}</span></p>
                <p className="text-slate-600">Student: {s.studentName}{s.studentPhone && ` · ${s.studentPhone}`}</p>
                <JoinBox user={user} booking={s} clockOffset={offset} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-5">
        <h2 className="mb-3 flex items-center gap-2 font-bold"><Wallet size={18} />My earnings</h2>
        <p className="mb-3 text-sm text-slate-600">Your rate: {lkr(data.payRate)} per booked hour. Sessions count once the SmartLabs office confirms them.</p>
        {data.earnings.length === 0 ? <p className="text-sm text-slate-500">No confirmed sessions yet.</p> : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-slate-500"><tr><th className="py-1">Month</th><th>Sessions</th><th>Hours</th><th>Earned</th><th>Paid</th></tr></thead>
            <tbody>{data.earnings.map(e => <tr key={e.key} className="border-t"><td className="py-2">{e.month}</td><td>{e.sessions}</td><td>{e.hours}</td><td>{lkr(e.amount)}</td><td>{lkr(e.paidAmount)}</td></tr>)}</tbody>
          </table>
        )}
      </section>

      {past.length > 0 && (
        <section className="rounded-2xl border bg-white p-5">
          <h2 className="mb-3 font-bold">Past sessions</h2>
          <ul className="divide-y text-sm">
            {past.map(s => (
              <li key={s.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{fmtDate(s.date)} · {fmtTime(s.startMin)} · {s.hours} h · {s.studentName}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[s.status]}`}>{s.status === 'confirmed' ? 'Awaiting office confirmation' : STATUS_LABEL[s.status]}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28"><div className="mx-auto max-w-3xl space-y-6">{children}</div></main>;
}
