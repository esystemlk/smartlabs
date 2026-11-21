'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Loader2, ArrowLeft, FileUp } from 'lucide-react';
import { useUser } from '@/firebase';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { otoApi, fmtDate, STATUS_LABEL, STATUS_TONE, JoinBox, CancellationPolicy } from '@/components/one-to-one/shared';
import { fmtTime, lkr } from '@/lib/one-to-one';

type Booking = {
  id: string; lecturerName: string; lecturerPhoto: string; mode: string; hours: number; date: string; startMin: number; endMin: number;
  startAt: number; endAt: number; price: number; status: string;
  cancel: { by: string; reason?: string } | null; refund: { status: string; amount: number; band?: string } | null; medical: { status: string } | null;
};

const REFUND_LABEL: Record<string, string> = { pending: 'Refund being processed', refunded: 'Refunded', credit: 'Course credit given', none: 'Not refunded' };

function MyBookings() {
  const { user, isUserLoading } = useUser();
  const params = useSearchParams();
  const [list, setList] = useState<Booking[] | null>(null);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState('');
  const [cancel, setCancel] = useState<{ b: Booking; message?: string; refundAmount?: number; busy?: boolean } | null>(null);
  const [medical, setMedical] = useState<{ b: Booking; note: string; file: string; busy?: boolean; error?: string } | null>(null);
  const paid = params.get('payment') === 'success';

  const load = useCallback(async () => {
    if (!user) return;
    try { const d = await otoApi<{ bookings: Booking[]; now: number }>(user, 'my'); setList(d.bookings); setOffset(d.now - Date.now()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
  }, [user]);
  useEffect(() => { void load(); }, [load]);
  // PayHere confirms in the background; poll briefly after returning from checkout.
  useEffect(() => {
    if (!paid || !list?.some(b => b.status === 'held')) return;
    const t = setTimeout(() => void load(), 4000);
    return () => clearTimeout(t);
  }, [paid, list, load]);

  const openCancel = async (b: Booking) => {
    setCancel({ b, busy: true });
    try { const r = await otoApi<{ message: string; refundAmount: number }>(user, 'my', { action: 'cancel', bookingId: b.id }); setCancel({ b, ...r }); }
    catch (e) { setCancel(null); setError(e instanceof Error ? e.message : 'Failed'); }
  };
  const doCancel = async () => {
    if (!cancel) return;
    setCancel({ ...cancel, busy: true });
    try { await otoApi(user, 'my', { action: 'cancel', bookingId: cancel.b.id, confirm: true }); setCancel(null); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); setCancel(null); }
  };
  const pickFile = (f: File) => {
    if (!medical) return;
    if (f.size > 650_000) { setMedical({ ...medical, error: 'File is too large. Please keep it under 650 KB (take a photo at lower quality or use a PDF).' }); return; }
    const r = new FileReader();
    r.onload = () => setMedical(m => m && { ...m, file: String(r.result), error: '' });
    r.readAsDataURL(f);
  };
  const sendMedical = async () => {
    if (!medical?.file) return;
    setMedical({ ...medical, busy: true });
    try { await otoApi(user, 'my', { action: 'medical', bookingId: medical.b.id, note: medical.note, file: medical.file }); setMedical(null); await load(); }
    catch (e) { setMedical({ ...medical, busy: false, error: e instanceof Error ? e.message : 'Failed' }); }
  };

  if (isUserLoading) return <Shell><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Shell>;
  if (!user) return <Shell><p>Please <Link className="font-bold underline" href="/login?redirect=/one-to-one/my-bookings">sign in</Link> to see your bookings.</p></Shell>;

  const now = Date.now() + offset;
  const upcoming = (list ?? []).filter(b => (b.status === 'confirmed' || b.status === 'held') && b.endAt >= now).sort((a, b) => a.startAt - b.startAt);
  const past = (list ?? []).filter(b => !upcoming.includes(b));
  const canMedical = (b: Booking) => ['cancelled', 'no_show', 'confirmed'].includes(b.status) && !b.medical && b.cancel?.by !== 'admin' && b.cancel?.by !== 'system'
    && b.refund?.status !== 'pending' && b.refund?.status !== 'refunded' && now <= b.endAt + 48 * 3_600_000;

  const card = (b: Booking) => (
    <li key={b.id} className="space-y-3 rounded-2xl border bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          {b.lecturerPhoto && <img src={b.lecturerPhoto} alt="" className="h-12 w-12 rounded-xl object-cover" />}
          <div>
            <p className="font-bold">{fmtDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' })} · {fmtTime(b.startMin)} – {fmtTime(b.endMin)}</p>
            <p className="text-sm text-slate-600">{b.lecturerName} · {b.hours} h · {b.mode === 'online' ? 'Online (Zoom)' : 'Physical class'} · {lkr(b.price)}</p>
          </div>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
      </div>
      {b.status === 'held' && <p className="text-sm text-amber-800">We are waiting for PayHere to confirm your payment. This usually takes under a minute.</p>}
      {b.status === 'confirmed' && <JoinBox user={user} booking={b} clockOffset={offset} />}
      {b.cancel?.reason && <p className="text-xs text-slate-600">Reason: {b.cancel.reason}</p>}
      {b.refund && b.refund.status !== 'none' && <p className="text-sm font-semibold">{REFUND_LABEL[b.refund.status]}{b.refund.amount ? ` · ${lkr(b.refund.amount)}` : ''}</p>}
      {b.medical && <p className="text-sm">Medical certificate: <strong>{b.medical.status === 'submitted' ? 'under review' : b.medical.status}</strong></p>}
      <div className="flex flex-wrap gap-2">
        {b.status === 'confirmed' && b.startAt > now && <button className="rounded-lg border px-3 py-1.5 text-sm font-semibold" onClick={() => void openCancel(b)}>Cancel booking</button>}
        {canMedical(b) && <button className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-semibold" onClick={() => setMedical({ b, note: '', file: '' })}><FileUp size={14} />Submit medical certificate</button>}
      </div>
    </li>
  );

  return (
    <Shell>
      <Link href="/one-to-one" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600"><ArrowLeft size={14} />Book another session</Link>
      <h1 className="text-3xl font-black">My one-to-one bookings</h1>
      {paid && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">Thank you! Your payment was received. A confirmation email is on its way.</p>}
      {params.get('payment') === 'cancelled' && <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Payment was cancelled, so the time was not booked. You can choose a slot again.</p>}
      {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
      {!list ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : (
        <>
          <section><h2 className="mb-3 font-bold">Upcoming</h2>
            {upcoming.length ? <ul className="space-y-3">{upcoming.map(card)}</ul> : <p className="rounded-2xl border bg-white p-5 text-sm text-slate-600">No upcoming sessions. <Link href="/one-to-one" className="font-bold underline">Book one</Link>.</p>}
          </section>
          {past.length > 0 && <section><h2 className="mb-3 font-bold">Past &amp; cancelled</h2><ul className="space-y-3">{past.map(card)}</ul></section>}
        </>
      )}
      <CancellationPolicy />

      <Dialog open={!!cancel} onOpenChange={o => !o && setCancel(null)}>
        <DialogContent>
          <DialogTitle>Cancel this session?</DialogTitle>
          <DialogDescription>{cancel && `${cancel.b.lecturerName} · ${fmtDate(cancel.b.date)} · ${fmtTime(cancel.b.startMin)}`}</DialogDescription>
          {!cancel?.message ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : (
            <div className="space-y-4 text-sm">
              <p className="rounded-xl bg-amber-50 p-3 text-amber-900">{cancel.message}</p>
              <p>Refund: <strong>{lkr(cancel.refundAmount ?? 0)}</strong></p>
              <p className="text-xs text-slate-600">Cancelling because you are ill? Cancel first, then use “Submit medical certificate” for a full refund.</p>
              <div className="flex justify-end gap-2">
                <button className="rounded-lg border px-4 py-2 font-semibold" onClick={() => setCancel(null)}>Keep booking</button>
                <button className="rounded-lg bg-rose-600 px-4 py-2 font-semibold text-white disabled:opacity-50" disabled={cancel.busy} onClick={() => void doCancel()}>Yes, cancel</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!medical} onOpenChange={o => !o && setMedical(null)}>
        <DialogContent>
          <DialogTitle>Submit a medical certificate</DialogTitle>
          <DialogDescription>Upload a clear photo or PDF of a valid medical certificate. If approved, you receive a full refund.{medical?.b.status === 'confirmed' && medical.b.startAt > now && ' Submitting this also cancels the booking.'}</DialogDescription>
          {medical && (
            <div className="space-y-3 text-sm">
              <input type="file" accept="image/png,image/jpeg,image/webp,application/pdf" aria-label="Medical certificate file" onChange={e => e.target.files?.[0] && pickFile(e.target.files[0])} />
              <label className="block text-xs font-semibold">Note (optional)<Textarea rows={2} value={medical.note} onChange={e => setMedical({ ...medical, note: e.target.value })} /></label>
              {medical.error && <p role="alert" className="text-rose-700">{medical.error}</p>}
              <button className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground disabled:opacity-50" disabled={!medical.file || medical.busy} onClick={() => void sendMedical()}>
                {medical.busy ? 'Sending…' : 'Submit certificate'}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen bg-slate-50 px-4 pb-16 pt-28 text-slate-900"><div className="mx-auto max-w-3xl space-y-6">{children}</div></main>;
}

export default function Page() {
  return <Suspense fallback={<Shell><Loader2 className="mx-auto h-6 w-6 animate-spin" /></Shell>}><MyBookings /></Suspense>;
}
