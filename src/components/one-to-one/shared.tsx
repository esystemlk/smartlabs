'use client';

import { useEffect, useState } from 'react';
import type { User } from 'firebase/auth';
import { Trash2, Plus, Video, MapPin, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { fmtTime, JOIN_EARLY_MIN, POLICY_INTRO, POLICY_OUTRO, POLICY_POINTS, colomboDate } from '@/lib/one-to-one';

/** fetch an /api/one-to-one route with the user's token; throws Error(message) on failure. */
export async function otoApi<T = Record<string, unknown>>(user: User | null, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (user) headers.Authorization = `Bearer ${await user.getIdToken()}`;
  const res = await fetch(`/api/one-to-one/${path}`, body === undefined ? { headers, cache: 'no-store' } : { method: 'POST', headers, body: JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw Object.assign(new Error(data.error || 'Something went wrong. Please try again.'), { code: data.code });
  return data as T;
}

export const fmtDate = (date: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { ...opts, timeZone: 'UTC' });

export const STATUS_LABEL: Record<string, string> = {
  held: 'Awaiting payment', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled', no_show: 'Missed', expired: 'Expired',
};
export const STATUS_TONE: Record<string, string> = {
  held: 'bg-amber-100 text-amber-800', confirmed: 'bg-emerald-100 text-emerald-800', completed: 'bg-sky-100 text-sky-800',
  cancelled: 'bg-slate-200 text-slate-700', no_show: 'bg-rose-100 text-rose-800', expired: 'bg-slate-100 text-slate-500',
};

export function CancellationPolicy({ compact = false }: { compact?: boolean }) {
  return (
    <section aria-labelledby="oto-policy" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-950">
      <h2 id="oto-policy" className="text-base font-bold">Cancellation &amp; Refund Policy</h2>
      {!compact && <p className="mt-2 leading-6">{POLICY_INTRO}</p>}
      <ul className="mt-3 space-y-2">
        {POLICY_POINTS.map(p => <li key={p.title} className="leading-6"><strong>{p.title}:</strong> {p.text}</li>)}
      </ul>
      <p className="mt-3 leading-6">{POLICY_OUTRO}</p>
    </section>
  );
}

/** Shows the Zoom link / address only from 30 min before start until the end (server enforces it too). */
export function JoinBox({ user, booking, clockOffset }: { user: User | null; booking: { id: string; startAt: number; endAt: number; mode: string }; clockOffset: number }) {
  const [now, setNow] = useState(() => Date.now() + clockOffset);
  const [info, setInfo] = useState<{ open?: boolean; link?: string; address?: string; message?: string } | null>(null);
  const opensAt = booking.startAt - JOIN_EARLY_MIN * 60_000;
  const isOpen = now >= opensAt && now <= booking.endAt;

  useEffect(() => { const t = setInterval(() => setNow(Date.now() + clockOffset), 1000); return () => clearInterval(t); }, [clockOffset]);
  useEffect(() => {
    if (!isOpen || info?.open) return;
    otoApi<{ open: boolean; link?: string; address?: string; message?: string }>(user, `join?booking=${booking.id}`).then(setInfo).catch(() => setInfo(null));
  }, [isOpen, info?.open, user, booking.id]);

  if (now > booking.endAt) return null;
  if (!isOpen) {
    const ms = opensAt - now, d = Math.floor(ms / 86_400_000), h = Math.floor(ms / 3_600_000) % 24, m = Math.floor(ms / 60_000) % 60, s = Math.floor(ms / 1000) % 60;
    return (
      <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-700">
        {booking.mode === 'online' ? <Video size={14} className="mr-1 inline" /> : <MapPin size={14} className="mr-1 inline" />}
        {booking.mode === 'online' ? 'Your Zoom link' : 'The class address'} will appear here 30 minutes before your session — in{' '}
        <strong aria-live="off">{d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`}</strong>.
      </p>
    );
  }
  if (!info?.open) return <p className="text-xs text-slate-600"><Loader2 size={14} className="mr-1 inline animate-spin" />Getting your session details…</p>;
  if (booking.mode === 'physical') return <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900"><MapPin size={14} className="mr-1 inline" />Class location: <strong>{info.address}</strong></p>;
  return info.link
    ? <a href={info.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-700"><Video size={16} />Join Zoom session</a>
    : <p className="text-sm text-rose-700">{info.message}</p>;
}

export type Window = { id: string; date: string; startMin: number; endMin: number };

/** Add / remove availability windows. `onAdd` / `onRemove` call the right API for lecturer or admin. */
export function AvailabilityEditor({ windows, onAdd, onRemove }: {
  windows: Window[];
  onAdd: (v: { date: string; start: string; end: string; repeatWeeks: number }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState({ date: colomboDate(Date.now()), start: '09:00', end: '12:00', repeatWeeks: 1 });
  const [busy, setBusy] = useState<string | null>(null);
  const run = async (key: string, fn: () => Promise<void>, ok: string) => {
    setBusy(key);
    try { await fn(); toast({ title: ok }); } catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Failed' }); } finally { setBusy(null); }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5 sm:items-end">
        <label className="col-span-2 text-xs font-semibold sm:col-span-1">Date<Input type="date" value={form.date} min={colomboDate(Date.now())} onChange={e => setForm({ ...form, date: e.target.value })} /></label>
        <label className="text-xs font-semibold">From<Input type="time" step={1800} value={form.start} onChange={e => setForm({ ...form, start: e.target.value })} /></label>
        <label className="text-xs font-semibold">To<Input type="time" step={1800} value={form.end} onChange={e => setForm({ ...form, end: e.target.value })} /></label>
        <label className="text-xs font-semibold">Repeat weekly<Input type="number" min={1} max={12} value={form.repeatWeeks} onChange={e => setForm({ ...form, repeatWeeks: Number(e.target.value) })} aria-describedby="oto-repeat-help" /></label>
        <Button disabled={busy === 'add'} onClick={() => run('add', () => onAdd(form), 'Availability added')}>
          {busy === 'add' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Add
        </Button>
      </div>
      <p id="oto-repeat-help" className="text-xs text-slate-500">“Repeat weekly” adds the same time for that many weeks (1 = this date only). Students see start times every 30 minutes inside each window.</p>
      {windows.length === 0 ? <p className="text-sm text-slate-500">No upcoming availability yet.</p> : (
        <ul className="divide-y rounded-xl border">
          {windows.map(w => (
            <li key={w.id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
              <span><strong>{fmtDate(w.date)}</strong> · {fmtTime(w.startMin)} – {fmtTime(w.endMin)}</span>
              <Button variant="ghost" size="sm" aria-label={`Remove ${fmtDate(w.date)} ${fmtTime(w.startMin)}`} disabled={busy === w.id} onClick={() => run(w.id, () => onRemove(w.id), 'Removed')}>
                {busy === w.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
