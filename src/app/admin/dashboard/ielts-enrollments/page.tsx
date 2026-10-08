'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { ArrowLeft, Loader2, GraduationCap, Search, RefreshCw, Users, Save, MessageCircle, CheckCircle2 } from 'lucide-react';

interface Enrollment {
  orderId: string; userId: string; fullName: string; phone: string; email: string;
  amountPaid: number; batchStatus: string; batchName: string; startDate: string; schedule: string; whatsappLink: string; createdAtMs: number;
}

const fmtDate = (ms: number) => { try { return ms ? new Date(ms).toLocaleDateString() : '—'; } catch { return '—'; } };
const lkr = (n: number) => 'LKR ' + Math.round(n || 0).toLocaleString('en-LK');
// Normalise a Sri Lankan number to international form for wa.me (no +).
function waNumber(phone: string): string {
  let p = (phone || '').replace(/[^0-9]/g, '');
  if (p.startsWith('0')) p = '94' + p.slice(1);
  else if (!p.startsWith('94') && p.length === 9) p = '94' + p;
  return p;
}

export default function IeltsEnrollmentsPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'awaiting_batch' | 'enrolled'>('all');
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ batchName: '', startDate: '', schedule: '', whatsappLink: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      const role = snap.data()?.role;
      if (['admin', 'developer', 'teacher'].includes(role)) setAllowed(true);
      else { setAllowed(false); router.replace('/dashboard'); }
    });
  }, [user, isUserLoading, firestore, router]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true); setError('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/ielts-enrollment/list', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Could not load.'); return; }
      setRows(data.enrollments ?? []);
    } catch { setError('Network error.'); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const openEdit = (r: Enrollment) => {
    setEditing(r.orderId);
    setForm({ batchName: r.batchName, startDate: r.startDate, schedule: r.schedule, whatsappLink: r.whatsappLink });
  };

  const saveAssign = async (r: Enrollment) => {
    if (form.batchName.trim().length < 2) { alert('Enter a batch name.'); return; }
    setBusy(true);
    try {
      const token = await user!.getIdToken();
      const res = await fetch('/api/admin/ielts-enrollment/assign', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ orderId: r.orderId, ...form }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed.'); return; }
      setRows((prev) => prev.map((x) => x.orderId === r.orderId ? { ...x, ...form, batchStatus: 'enrolled' } : x));
      setEditing(null);
    } catch { alert('Network error.'); }
    finally { setBusy(false); }
  };

  const sendWhatsApp = (r: Enrollment) => {
    const lines = [
      `Hi ${r.fullName || 'there'}, this is Smart Labs 👋`,
      `You're enrolled in our IELTS course${r.batchName ? ` — ${r.batchName}` : ''}.`,
      r.startDate ? `Start date: ${r.startDate}` : '',
      r.schedule ? `Schedule: ${r.schedule}` : '',
      r.whatsappLink ? `Join your batch group: ${r.whatsappLink}` : '',
      `Any questions? Call us on 070 691 4652.`,
    ].filter(Boolean);
    const url = `https://wa.me/${waNumber(r.phone)}?text=${encodeURIComponent(lines.join('\n'))}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isUserLoading || allowed === null) return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (!allowed) return null;

  const term = q.trim().toLowerCase();
  const counts = { awaiting_batch: rows.filter(r => r.batchStatus !== 'enrolled').length, enrolled: rows.filter(r => r.batchStatus === 'enrolled').length };
  const shown = rows.filter((r) => {
    const statusOk = filter === 'all' || (filter === 'enrolled' ? r.batchStatus === 'enrolled' : r.batchStatus !== 'enrolled');
    const hay = `${r.fullName} ${r.phone} ${r.email} ${r.batchName}`.toLowerCase();
    return statusOk && (!term || hay.includes(term));
  });

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Admin dashboard</Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-black"><GraduationCap size={22} className="text-blue-600" /> IELTS Enrolments</h1>
      <p className="mt-2 text-sm text-slate-600">Students who paid for the IELTS course. Assign a batch to notify them by email, and send WhatsApp details.</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, phone, email…" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          <option value="all">All ({rows.length})</option>
          <option value="awaiting_batch">Awaiting batch ({counts.awaiting_batch})</option>
          <option value="enrolled">Enrolled ({counts.enrolled})</option>
        </select>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? <div className="flex items-center gap-2 py-8 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          : shown.length === 0 ? <p className="py-8 text-center text-sm text-slate-400"><Users size={16} className="mx-auto mb-2 opacity-40" /> No enrolments.</p>
          : shown.map((r) => {
            const enrolled = r.batchStatus === 'enrolled';
            return (
              <div key={r.orderId} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{r.fullName || '—'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${enrolled ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{enrolled ? `Enrolled · ${r.batchName}` : 'Awaiting batch'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{r.phone || '—'} · {r.email || '—'} · {lkr(r.amountPaid)} · {fmtDate(r.createdAtMs)}</p>
                    {enrolled && (r.startDate || r.schedule) && <p className="mt-1 text-xs text-slate-500">{[r.startDate, r.schedule].filter(Boolean).join(' · ')}</p>}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <button onClick={() => openEdit(r)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700"><GraduationCap size={13} /> {enrolled ? 'Edit batch' : 'Assign batch'}</button>
                    <button onClick={() => sendWhatsApp(r)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700"><MessageCircle size={13} /> WhatsApp</button>
                  </div>
                </div>

                {editing === r.orderId && (
                  <div className="mt-3 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-2">
                    <input value={form.batchName} onChange={(e) => setForm({ ...form, batchName: e.target.value })} placeholder="Batch name *" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <input value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} placeholder="Start date (e.g. 1 Nov 2026)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <input value={form.schedule} onChange={(e) => setForm({ ...form, schedule: e.target.value })} placeholder="Schedule (e.g. Mon–Fri 8–10 PM)" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <input value={form.whatsappLink} onChange={(e) => setForm({ ...form, whatsappLink: e.target.value })} placeholder="WhatsApp group link" className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <button disabled={busy} onClick={() => saveAssign(r)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50">{busy ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save &amp; notify student</button>
                      <button onClick={() => setEditing(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100">Cancel</button>
                    </div>
                    <p className="text-[11px] text-slate-400 sm:col-span-2"><CheckCircle2 size={11} className="inline" /> Saving emails the student their batch details.</p>
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
}
