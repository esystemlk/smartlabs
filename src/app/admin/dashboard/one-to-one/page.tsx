'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarClock, Loader2, Pencil, Plus, Upload, Users, Wallet, ShieldAlert, Settings, ClipboardCheck, RefreshCw } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { otoApi, fmtDate, STATUS_LABEL, STATUS_TONE, AvailabilityEditor, type Window } from '@/components/one-to-one/shared';
import { fmtTime, lkr, type OtoLecturer, type OtoMode } from '@/lib/one-to-one';

type AdminLecturer = OtoLecturer & { uid: string; linkedEmail: string; payRate: number; zoomLink: string; phone: string; email: string; availability: Window[] };
type Booking = {
  id: string; lecturerId: string; lecturerName: string; studentName: string; studentEmail: string; studentPhone: string;
  mode: OtoMode; hours: number; date: string; startMin: number; endMin: number; startAt: number; endAt: number; price: number; status: string; orderId: string;
  cancel: { by: string; band?: string; reason?: string; at: number } | null;
  refund: { status: string; amount: number; band?: string; note?: string } | null;
  medical: { status: string; note?: string } | null;
  completion: { actualStartMin: number; actualEndMin: number; note?: string } | null; payAmount: number | null;
};
type Payout = { key: string; lecturerName: string; month: string; sessions: number; hours: number; amount: number; paidAmount: number; paidAt?: number; ref?: string };
type Data = { lecturers: AdminLecturer[]; bookings: Booking[]; payouts: Payout[]; settings: Record<string, string | number>; now: number };

const EMPTY_LECTURER = { name: '', title: '', bio: '', photoUrl: '', subjects: 'PTE, IELTS', modes: ['online'] as OtoMode[], priceOnline: 0, pricePhysical: 0, payRate: 0, zoomLink: '', phone: '', email: '', linkEmail: '', active: true };
const hhmm = (m: number) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const when = (b: Booking) => `${fmtDate(b.date)} · ${fmtTime(b.startMin)}–${fmtTime(b.endMin)}`;

export default function AdminOneToOnePage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [data, setData] = useState<Data | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<(typeof EMPTY_LECTURER & { id?: string }) | null>(null);
  const [availFor, setAvailFor] = useState<string | null>(null);
  const [confirmFor, setConfirmFor] = useState<Booking | null>(null);
  const [filter, setFilter] = useState({ q: '', status: 'upcoming' });

  const load = useCallback(async () => {
    if (!user) return;
    try { setData(await otoApi<Data>(user, 'admin')); } catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Failed to load' }); }
  }, [user, toast]);
  useEffect(() => { void load(); }, [load]);

  const act = async (key: string, body: Record<string, unknown>, ok: string) => {
    setBusy(key);
    try { await otoApi(user, 'admin', body); toast({ title: ok }); await load(); return true; }
    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Failed' }); return false; }
    finally { setBusy(null); }
  };

  const now = data?.now ?? Date.now();
  const bookings = useMemo(() => (data?.bookings ?? []).filter(b => {
    const q = filter.q.toLowerCase();
    if (q && !`${b.studentName} ${b.studentEmail} ${b.lecturerName} ${b.orderId}`.toLowerCase().includes(q)) return false;
    if (filter.status === 'upcoming') return b.status === 'confirmed' && b.endAt >= now;
    return filter.status === 'all' || b.status === filter.status;
  }).sort((a, b) => filter.status === 'upcoming' ? a.startAt - b.startAt : b.startAt - a.startAt), [data, filter, now]);
  const toConfirm = (data?.bookings ?? []).filter(b => b.status === 'confirmed' && b.endAt < now).sort((a, b) => a.startAt - b.startAt);
  const refunds = (data?.bookings ?? []).filter(b => b.refund?.status === 'pending' || b.medical?.status === 'submitted' || (b.refund?.band === 'late' && b.refund.status === 'none'));
  const unpaid = (data?.payouts ?? []).reduce((s, p) => s + Math.max(0, p.amount - p.paidAmount), 0);

  const uploadPhoto = async (file: File) => {
    if (!user || !editing) return;
    if (file.size > 3_000_000) { toast({ variant: 'destructive', title: 'Photo must be under 3 MB' }); return; }
    setBusy('photo');
    try {
      const b64 = await new Promise<string>((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = no; r.readAsDataURL(file); });
      const res = await fetch('/api/upload', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify({ fileBase64: b64, fileName: `lecturer-${Date.now()}-${file.name.replace(/[^\w.-]/g, '')}`, folder: 'images' }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Upload failed');
      setEditing({ ...editing, photoUrl: j.url });
    } catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Upload failed' }); } finally { setBusy(null); }
  };

  const saveLecturer = async () => {
    if (!editing) return;
    const ok = await act('saveLecturer', { action: 'saveLecturer', ...editing, subjects: editing.subjects.split(',').map(s => s.trim()).filter(Boolean) }, 'Lecturer saved');
    if (ok) setEditing(null);
  };

  if (!data) return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  const availLecturer = data.lecturers.find(l => l.id === availFor);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black"><CalendarClock className="h-6 w-6 text-primary" />One-to-One Sessions</h1>
          <p className="text-sm text-muted-foreground">Lecturers, bookings, session confirmations, refunds and lecturer payments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => void load()}><RefreshCw className="h-4 w-4" />Refresh</Button>
          <a href="/one-to-one" target="_blank" className="inline-flex items-center rounded-md border px-3 text-sm font-medium">Student page ↗</a>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[['Upcoming sessions', data.bookings.filter(b => b.status === 'confirmed' && b.endAt >= now).length],
          ['To confirm', toConfirm.length], ['Refunds / medical', refunds.length], ['Unpaid to lecturers', lkr(unpaid)]].map(([k, v]) => (
          <div key={k} className="rounded-2xl border bg-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="text-xl font-black">{v}</p></div>
        ))}
      </div>

      <Tabs defaultValue="bookings">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="bookings"><CalendarClock className="mr-1 h-4 w-4" />Bookings</TabsTrigger>
          <TabsTrigger value="confirm"><ClipboardCheck className="mr-1 h-4 w-4" />Confirm sessions {toConfirm.length > 0 && `(${toConfirm.length})`}</TabsTrigger>
          <TabsTrigger value="lecturers"><Users className="mr-1 h-4 w-4" />Lecturers</TabsTrigger>
          <TabsTrigger value="payouts"><Wallet className="mr-1 h-4 w-4" />Lecturer payments</TabsTrigger>
          <TabsTrigger value="refunds"><ShieldAlert className="mr-1 h-4 w-4" />Refunds &amp; medical {refunds.length > 0 && `(${refunds.length})`}</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="mr-1 h-4 w-4" />Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input className="max-w-xs" placeholder="Search student, lecturer, order…" value={filter.q} onChange={e => setFilter({ ...filter, q: e.target.value })} aria-label="Search bookings" />
            <select className="rounded-md border px-3 text-sm" value={filter.status} onChange={e => setFilter({ ...filter, status: e.target.value })} aria-label="Filter by status">
              <option value="upcoming">Upcoming</option><option value="all">All</option>
              {Object.entries(STATUS_LABEL).filter(([k]) => k !== 'expired').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-muted/50 text-left text-xs"><tr><th className="p-3">When</th><th>Student</th><th>Lecturer</th><th>Type</th><th>Paid</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {bookings.map(b => (
                  <tr key={b.id} className="border-t align-top">
                    <td className="p-3 font-medium">{when(b)}<div className="text-xs text-muted-foreground">{b.hours} h</div></td>
                    <td className="py-3">{b.studentName}<div className="text-xs text-muted-foreground">{b.studentEmail}{b.studentPhone && ` · ${b.studentPhone}`}</div></td>
                    <td className="py-3">{b.lecturerName}</td>
                    <td className="py-3 capitalize">{b.mode}</td>
                    <td className="py-3">{lkr(b.price)}<div className="text-[11px] text-muted-foreground">{b.orderId}</div></td>
                    <td className="py-3"><span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
                      {b.cancel?.reason && <div className="mt-1 text-xs text-muted-foreground">{b.cancel.by}: {b.cancel.reason}</div>}</td>
                    <td className="py-3 pr-3 text-right">
                      {b.status === 'confirmed' && b.startAt > now && (
                        <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => {
                          const reason = prompt('Reason for cancelling (student gets a full refund):', 'Lecturer unavailable');
                          if (reason !== null) void act(b.id, { action: 'cancelBooking', id: b.id, reason }, 'Booking cancelled — refund pending');
                        }}>Cancel</Button>
                      )}
                    </td>
                  </tr>
                ))}
                {!bookings.length && <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No bookings match.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="confirm" className="space-y-3">
          <p className="text-sm text-muted-foreground">Sessions that have ended. Enter the actual times and confirm — only confirmed sessions count toward lecturer pay (booked hours × the lecturer’s hourly pay).</p>
          {toConfirm.map(b => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4">
              <div><p className="font-semibold">{b.lecturerName} → {b.studentName}</p><p className="text-sm text-muted-foreground">{when(b)} · {b.hours} h · {b.mode}</p></div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={busy === b.id} onClick={() => confirm('Mark this session as missed by the student?') && void act(b.id, { action: 'markNoShow', id: b.id }, 'Marked as missed')}>Student missed</Button>
                <Button size="sm" onClick={() => setConfirmFor(b)}>Confirm completed</Button>
              </div>
            </div>
          ))}
          {!toConfirm.length && <p className="rounded-2xl border p-6 text-center text-muted-foreground">Nothing to confirm right now.</p>}
        </TabsContent>

        <TabsContent value="lecturers" className="space-y-3">
          <Button onClick={() => setEditing({ ...EMPTY_LECTURER })}><Plus className="h-4 w-4" />Add lecturer</Button>
          <div className="grid gap-3 md:grid-cols-2">
            {data.lecturers.map(l => (
              <div key={l.id} className="flex gap-4 rounded-2xl border p-4">
                {l.photoUrl ? <img src={l.photoUrl} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="h-20 w-20 rounded-xl bg-muted" />}
                <div className="min-w-0 flex-1 text-sm">
                  <p className="font-bold">{l.name} {!l.active && <span className="text-xs text-rose-600">(hidden)</span>}</p>
                  <p className="text-muted-foreground">{l.title}</p>
                  <p className="mt-1">{l.modes.includes('online') && `Online ${lkr(l.priceOnline ?? 0)}/h`}{l.modes.length > 1 && ' · '}{l.modes.includes('physical') && `Physical ${lkr(l.pricePhysical ?? 0)}/h`}</p>
                  <p className="text-xs text-muted-foreground">Pay {lkr(l.payRate)}/h · {l.zoomLink ? 'Zoom set' : 'No Zoom link'} · {l.linkedEmail ? `Login: ${l.linkedEmail}` : 'No lecturer login'} · {l.availability.length} upcoming windows</p>
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => setEditing({ ...EMPTY_LECTURER, ...l, subjects: l.subjects.join(', '), linkEmail: l.linkedEmail })}><Pencil className="h-3 w-3" />Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => setAvailFor(l.id)}><CalendarClock className="h-3 w-3" />Availability</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-3">
          <p className="text-sm text-muted-foreground">Confirmed sessions per lecturer per month. After paying a lecturer, record it here.</p>
          <div className="overflow-x-auto rounded-2xl border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/50 text-left text-xs"><tr><th className="p-3">Month</th><th>Lecturer</th><th>Sessions</th><th>Hours</th><th>Earned</th><th>Paid</th><th>Due</th><th></th></tr></thead>
              <tbody>
                {data.payouts.map(p => {
                  const due = Math.max(0, p.amount - p.paidAmount);
                  return (
                    <tr key={p.key} className="border-t">
                      <td className="p-3">{p.month}</td><td>{p.lecturerName}</td><td>{p.sessions}</td><td>{p.hours}</td><td>{lkr(p.amount)}</td>
                      <td>{lkr(p.paidAmount)}{p.ref && <div className="text-[11px] text-muted-foreground">{p.ref}</div>}</td>
                      <td className={due ? 'font-bold text-rose-700' : ''}>{lkr(due)}</td>
                      <td className="pr-3 text-right">{due > 0 && <Button size="sm" disabled={busy === p.key} onClick={() => {
                        const ref = prompt(`Record payment of ${lkr(due)} to ${p.lecturerName} for ${p.month}. Payment reference (bank ref, etc.):`, '');
                        if (ref !== null) void act(p.key, { action: 'markPaid', key: p.key, paidAmount: p.amount, ref }, 'Payment recorded');
                      }}>Mark paid</Button>}</td>
                    </tr>
                  );
                })}
                {!data.payouts.length && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground">No confirmed sessions yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="refunds" className="space-y-3">
          <p className="text-sm text-muted-foreground">Issue refunds in the PayHere portal first, then mark them here. Late cancellations (under 3 days) are non-refundable; you may record course credit instead.</p>
          {refunds.map(b => (
            <div key={b.id} className="space-y-2 rounded-2xl border p-4 text-sm">
              <div className="flex flex-wrap justify-between gap-2">
                <p><strong>{b.studentName}</strong> ({b.studentEmail}) · {b.lecturerName} · {when(b)} · paid {lkr(b.price)} · order {b.orderId}</p>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[b.status]}`}>{STATUS_LABEL[b.status]}</span>
              </div>
              {b.cancel && <p className="text-muted-foreground">Cancelled by {b.cancel.by}{b.cancel.band && ` · rule: ${b.cancel.band}`}{b.cancel.reason && ` · ${b.cancel.reason}`}</p>}
              {b.medical?.status === 'submitted' && (
                <div className="flex flex-wrap items-center gap-2 rounded-xl bg-sky-50 p-3">
                  <span>Medical certificate submitted{b.medical.note && `: “${b.medical.note}”`}</span>
                  <Button size="sm" variant="outline" onClick={async () => {
                    try { const m = await otoApi<{ file: string }>(user, `admin?medical=${b.id}`); const w = window.open(); w?.document.write(`<iframe src="${m.file}" style="border:0;width:100%;height:100vh"></iframe>`); }
                    catch (e) { toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Could not open' }); }
                  }}>View certificate</Button>
                  <Button size="sm" disabled={busy === b.id} onClick={() => void act(b.id, { action: 'reviewMedical', id: b.id, approve: true }, 'Approved — full refund pending')}>Approve (full refund)</Button>
                  <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => { const note = prompt('Reason for rejecting (sent to the student):', ''); if (note !== null) void act(b.id, { action: 'reviewMedical', id: b.id, approve: false, note }, 'Rejected'); }}>Reject</Button>
                </div>
              )}
              {b.refund?.status === 'pending' && (
                <Button size="sm" disabled={busy === b.id} onClick={() => { const note = prompt(`Refund ${lkr(b.refund!.amount)} done in PayHere? Add a note/reference:`, ''); if (note !== null) void act(b.id, { action: 'markRefund', id: b.id, kind: 'refunded', amount: b.refund!.amount, note }, 'Marked refunded'); }}>
                  Mark {lkr(b.refund.amount)} refunded
                </Button>
              )}
              {b.refund?.band === 'late' && b.refund.status === 'none' && b.medical?.status !== 'submitted' && (
                <Button size="sm" variant="outline" disabled={busy === b.id} onClick={() => { const amount = prompt('Course credit amount (LKR) to give this student:', String(Math.round(b.price / 2))); if (amount !== null) void act(b.id, { action: 'markRefund', id: b.id, kind: 'credit', amount: Number(amount), note: 'Course credit' }, 'Course credit recorded'); }}>
                  Record course credit
                </Button>
              )}
            </div>
          ))}
          {!refunds.length && <p className="rounded-2xl border p-6 text-center text-muted-foreground">No refunds or certificates waiting.</p>}
        </TabsContent>

        <TabsContent value="settings"><SettingsForm initial={data.settings} busy={busy === 'settings'} onSave={s => void act('settings', { action: 'saveSettings', settings: s }, 'Settings saved')} /></TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={o => !o && setEditing(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogTitle>{editing?.id ? 'Edit lecturer' : 'Add lecturer'}</DialogTitle>
          <DialogDescription>Public details show on the booking page. Pay rate, Zoom link and phone stay private.</DialogDescription>
          {editing && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 sm:col-span-2">
                {editing.photoUrl ? <img src={editing.photoUrl} alt="" className="h-20 w-20 rounded-xl object-cover" /> : <div className="h-20 w-20 rounded-xl bg-muted" />}
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm">
                  {busy === 'photo' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Upload photo
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={e => e.target.files?.[0] && void uploadPhoto(e.target.files[0])} />
                </label>
              </div>
              <label className="text-xs font-semibold">Name *<Input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label>
              <label className="text-xs font-semibold">Title<Input placeholder="Senior PTE Trainer" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value })} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Bio<Textarea rows={3} value={editing.bio} onChange={e => setEditing({ ...editing, bio: e.target.value })} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Subjects (comma separated)<Input value={editing.subjects} onChange={e => setEditing({ ...editing, subjects: e.target.value })} /></label>
              <fieldset className="text-xs font-semibold sm:col-span-2"><legend>Session types offered *</legend>
                <div className="mt-1 flex gap-4 font-normal">
                  {(['online', 'physical'] as OtoMode[]).map(m => (
                    <label key={m} className="flex items-center gap-2 capitalize"><input type="checkbox" checked={editing.modes.includes(m)}
                      onChange={e => setEditing({ ...editing, modes: e.target.checked ? [...editing.modes, m] : editing.modes.filter(x => x !== m) })} />{m}</label>
                  ))}
                </div>
              </fieldset>
              <label className="text-xs font-semibold">Student price / hour — online (LKR)<Input type="number" min={0} value={editing.priceOnline} onChange={e => setEditing({ ...editing, priceOnline: Number(e.target.value) })} /></label>
              <label className="text-xs font-semibold">Student price / hour — physical (LKR)<Input type="number" min={0} value={editing.pricePhysical} onChange={e => setEditing({ ...editing, pricePhysical: Number(e.target.value) })} /></label>
              <label className="text-xs font-semibold">Lecturer pay / hour (LKR, private)<Input type="number" min={0} value={editing.payRate} onChange={e => setEditing({ ...editing, payRate: Number(e.target.value) })} /></label>
              <label className="text-xs font-semibold">Phone (private)<Input value={editing.phone} onChange={e => setEditing({ ...editing, phone: e.target.value })} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Email for booking alerts (private — used if no login email is linked)<Input type="email" value={editing.email} onChange={e => setEditing({ ...editing, email: e.target.value })} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Recurring Zoom link (private, shown 30 min before class)<Input placeholder="https://zoom.us/j/…" value={editing.zoomLink} onChange={e => setEditing({ ...editing, zoomLink: e.target.value })} /></label>
              <label className="text-xs font-semibold sm:col-span-2">Lecturer login email (their SmartLabs account — gives access to the lecturer portal)<Input type="email" value={editing.linkEmail} onChange={e => setEditing({ ...editing, linkEmail: e.target.value })} /></label>
              <label className="flex items-center gap-2 text-sm sm:col-span-2"><input type="checkbox" checked={editing.active} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Show on the booking page</label>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                <Button disabled={busy === 'saveLecturer' || busy === 'photo'} onClick={() => void saveLecturer()}>{busy === 'saveLecturer' && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!availLecturer} onOpenChange={o => !o && setAvailFor(null)}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogTitle>Availability — {availLecturer?.name}</DialogTitle>
          <DialogDescription>Times are Sri Lanka time. Windows with a booking inside cannot be removed.</DialogDescription>
          {availLecturer && <AvailabilityEditor windows={availLecturer.availability}
            onAdd={async v => { await otoApi(user, 'admin', { action: 'addAvailability', lecturerId: availLecturer.id, ...v }); await load(); }}
            onRemove={async id => { await otoApi(user, 'admin', { action: 'removeAvailability', lecturerId: availLecturer.id, id }); await load(); }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmFor} onOpenChange={o => !o && setConfirmFor(null)}>
        <DialogContent>
          <DialogTitle>Confirm completed session</DialogTitle>
          {confirmFor && <ConfirmForm b={confirmFor} busy={busy === confirmFor.id} onSubmit={async v => { if (await act(confirmFor.id, { action: 'confirmCompleted', id: confirmFor.id, ...v }, 'Session confirmed')) setConfirmFor(null); }} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConfirmForm({ b, busy, onSubmit }: { b: Booking; busy: boolean; onSubmit: (v: { actualStart: string; actualEnd: string; note: string }) => void }) {
  const [v, setV] = useState({ actualStart: hhmm(b.startMin), actualEnd: hhmm(b.endMin), note: '' });
  return (
    <div className="space-y-3 text-sm">
      <DialogDescription>{b.lecturerName} → {b.studentName} · {when(b)} · booked {b.hours} h</DialogDescription>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs font-semibold">Actual start<Input type="time" value={v.actualStart} onChange={e => setV({ ...v, actualStart: e.target.value })} /></label>
        <label className="text-xs font-semibold">Actual end<Input type="time" value={v.actualEnd} onChange={e => setV({ ...v, actualEnd: e.target.value })} /></label>
      </div>
      <label className="block text-xs font-semibold">Note (optional)<Textarea rows={2} value={v.note} onChange={e => setV({ ...v, note: e.target.value })} /></label>
      <p className="text-xs text-muted-foreground">The lecturer is paid for the {b.hours} booked hour{b.hours > 1 ? 's' : ''} at their hourly pay.</p>
      <Button className="w-full" disabled={busy} onClick={() => onSubmit(v)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Confirm completed</Button>
    </div>
  );
}

function SettingsForm({ initial, busy, onSave }: { initial: Record<string, string | number>; busy: boolean; onSave: (s: Record<string, string | number>) => void }) {
  const [s, setS] = useState(initial);
  const field = (k: string, label: string, type = 'number') => (
    <label className="text-xs font-semibold">{label}<Input type={type} value={s[k] ?? ''} onChange={e => setS({ ...s, [k]: type === 'number' ? Number(e.target.value) : e.target.value })} /></label>
  );
  return (
    <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
      {field('stepMin', 'Start times every (minutes)')}
      {field('cooldownMin', 'Break between sessions (minutes)')}
      {field('holdMin', 'Hold slot while paying (minutes)')}
      {field('minNoticeHours', 'Minimum notice before a booking (hours)')}
      {field('daysAhead', 'Students can book up to (days ahead)')}
      <div className="sm:col-span-2">{field('address', 'Physical class address', 'text')}</div>
      <div className="sm:col-span-2">{field('fallbackZoom', 'Fallback Zoom link (used when a lecturer has none)', 'text')}</div>
      <Button className="sm:col-span-2" disabled={busy} onClick={() => onSave(s)}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save settings</Button>
    </div>
  );
}
