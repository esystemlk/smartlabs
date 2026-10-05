'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, serverTimestamp } from 'firebase/firestore';
import { useUser, useFirestore, useAuth } from '@/firebase';
import {
  ArrowLeft, Loader2, Plus, Trash2, Save, CheckCircle2, Coins, Users, XCircle,
  ShieldAlert, MailCheck, MailX, Search, RefreshCw, Ban, Pause, Play, Send, Megaphone, Power,
  GraduationCap, Phone, Undo2,
} from 'lucide-react';
import type { CommissionRate, CommissionSettings } from '@/components/partners/earnings';

const BLANK: CommissionSettings = { enabled: false, headline: '', description: '', rates: [], footnote: '' };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type App = any;
const STATUS_TONE: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700', needs_info: 'bg-orange-100 text-orange-700',
  approved: 'bg-emerald-100 text-emerald-700', rejected: 'bg-red-100 text-red-700', withdrawn: 'bg-slate-100 text-slate-600',
};
const STATUS_LABEL: Record<string, string> = { pending: 'Pending', needs_info: 'Needs info', approved: 'Approved', rejected: 'Rejected', withdrawn: 'Withdrawn' };
const fmtDate = (v: { toDate?: () => Date } | undefined) => { try { return v?.toDate ? v.toDate().toLocaleDateString() : '—'; } catch { return '—'; } };

export default function PartnersAdminPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const auth = useAuth();
  const router = useRouter();

  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<'applications' | 'partners' | 'referrals' | 'broadcast' | 'commission'>('applications');

  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { router.replace('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      const role = snap.data()?.role;
      if (['admin', 'developer', 'teacher'].includes(role)) setAllowed(true);
      else { setAllowed(false); router.replace('/dashboard'); }
    });
  }, [user, isUserLoading, firestore, router]);

  if (isUserLoading || allowed === null) {
    return <div className="flex min-h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  }
  if (!allowed) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft size={16} /> Admin dashboard</Link>
      <h1 className="mt-3 flex items-center gap-2 text-2xl font-black"><Users size={22} className="text-blue-600" /> Referral Partners</h1>

      <div className="mt-4 inline-flex flex-wrap rounded-xl border border-slate-200 bg-slate-50 p-1">
        {(['applications', 'partners', 'referrals', 'broadcast', 'commission'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-black capitalize transition-colors ${tab === t ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-900'}`}>
            {t === 'applications' ? 'Applications' : t === 'partners' ? 'Partners' : t === 'referrals' ? 'Referrals' : t === 'broadcast' ? 'Broadcast' : 'Commission'}
          </button>
        ))}
      </div>

      {tab === 'applications' && <Applications getToken={() => user!.getIdToken()} firestore={firestore} />}
      {tab === 'partners' && <Partners getToken={() => user!.getIdToken()} firestore={firestore} />}
      {tab === 'referrals' && <Referrals getToken={() => user!.getIdToken()} firestore={firestore} />}
      {tab === 'broadcast' && <Broadcast getToken={() => user!.getIdToken()} firestore={firestore} />}
      {tab === 'commission' && <Commission firestore={firestore} />}
    </div>
  );
}

/* ── Applications review queue ──────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Applications({ getToken, firestore }: { getToken: () => Promise<string>; firestore: any }) {
  const [apps, setApps] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'needs_info' | 'approved' | 'rejected' | 'withdrawn'>('pending');
  const [q, setQ] = useState('');
  const [busyRef, setBusyRef] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const snap = await getDocs(query(collection(firestore, 'partner_applications'), orderBy('createdAt', 'desc')));
      setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError('Could not load applications. Make sure the partner Firestore rules are published.');
      console.error(e);
    } finally { setLoading(false); }
  }, [firestore]);

  useEffect(() => { load(); }, [load]);

  const review = async (ref: string, action: 'approve' | 'reject' | 'request_info' | 'withdraw') => {
    let reason = '';
    if (action === 'reject' || action === 'request_info') {
      reason = window.prompt(action === 'reject' ? 'Reason for rejecting this application:' : 'What information is needed?') ?? '';
      if (!reason.trim()) return;
    } else if (!window.confirm(`${action === 'approve' ? 'Approve' : 'Withdraw'} application ${ref}?`)) return;

    setBusyRef(ref);
    try {
      const token = await getToken();
      const res = await fetch('/api/partners/admin/review', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ref, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed.'); return; }
      setApps((prev) => prev.map((a) => (a.ref === ref ? { ...a, reviewStatus: data.reviewStatus } : a)));
    } catch { alert('Network error.'); }
    finally { setBusyRef(null); }
  };

  const verifyEmail = async (uid: string, name: string) => {
    if (!window.confirm(`Verify the email for ${name} and grant access? Use this only when you've confirmed the address is theirs.`)) return;
    setVerifying(uid);
    try {
      const token = await getToken();
      const res = await fetch('/api/partners/admin/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed.'); return; }
      setApps((prev) => prev.map((a) => (a.uid === uid ? { ...a, emailVerified: true } : a)));
    } catch { alert('Network error.'); }
    finally { setVerifying(null); }
  };

  const term = q.trim().toLowerCase();
  const shown = apps.filter((a) => (filter === 'all' || a.reviewStatus === filter) &&
    (!term || (a.ref ?? '').toLowerCase().includes(term) || (a.fullName ?? '').toLowerCase().includes(term) || (a.email ?? '').toLowerCase().includes(term) || (a.businessName ?? '').toLowerCase().includes(term)));

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ref, name, email…" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          {['pending', 'needs_info', 'approved', 'rejected', 'withdrawn', 'all'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All' : STATUS_LABEL[s]}</option>)}
        </select>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? <div className="flex items-center gap-2 py-8 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          : shown.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No applications{filter !== 'all' ? ` (${STATUS_LABEL[filter]})` : ''}.</p>
          : shown.map((a) => {
            const canAct = a.reviewStatus === 'pending' || a.reviewStatus === 'needs_info';
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{a.fullName || '—'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{a.partnerType}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${STATUS_TONE[a.reviewStatus] ?? STATUS_TONE.pending}`}>{STATUS_LABEL[a.reviewStatus] ?? a.reviewStatus}</span>
                      {a.emailVerified
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600"><MailCheck size={11} /> verified</span>
                        : <button disabled={verifying === a.uid} onClick={() => verifyEmail(a.uid, a.fullName || a.email)} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 hover:bg-amber-200 disabled:opacity-50">{verifying === a.uid ? <Loader2 size={11} className="animate-spin" /> : <MailX size={11} />} Verify email</button>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {a.ref} · {a.email} · {a.phone} · {a.location}{a.businessName ? ` · ${a.businessName}` : ''} · {fmtDate(a.createdAt)}
                    </p>
                    {a.referralDescription ? <p className="mt-1 text-xs text-slate-500 line-clamp-2">“{a.referralDescription}”</p> : null}
                    {a.reviewReason ? <p className="mt-1 text-xs font-semibold text-orange-600">Note: {a.reviewReason}</p> : null}
                  </div>
                  {canAct && (
                    <div className="flex shrink-0 flex-wrap gap-1.5">
                      <button disabled={busyRef === a.ref} onClick={() => review(a.ref, 'approve')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"><CheckCircle2 size={13} /> Approve</button>
                      <button disabled={busyRef === a.ref} onClick={() => review(a.ref, 'request_info')} className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-50"><ShieldAlert size={13} /> Info</button>
                      <button disabled={busyRef === a.ref} onClick={() => review(a.ref, 'reject')} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"><XCircle size={13} /> Reject</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ── Partners roster (state management) ─────────────────────────────────────── */
const STATE_TONE: Record<string, string> = {
  active: 'bg-emerald-100 text-emerald-700', suspended: 'bg-amber-100 text-amber-700',
  deactivated: 'bg-orange-100 text-orange-700', banned: 'bg-red-100 text-red-700',
  pending_activation: 'bg-slate-100 text-slate-600', closed: 'bg-slate-100 text-slate-600',
};
const STATE_LABEL: Record<string, string> = {
  active: 'Active', suspended: 'Suspended', deactivated: 'Deactivated', banned: 'Banned',
  pending_activation: 'Pending', closed: 'Closed',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Partners({ getToken, firestore }: { getToken: () => Promise<string>; firestore: any }) {
  const [rows, setRows] = useState<App[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'suspended' | 'deactivated' | 'banned' | 'pending_activation'>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [verifying, setVerifying] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const snap = await getDocs(query(collection(firestore, 'partners'), orderBy('createdAt', 'desc')));
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError('Could not load partners. Make sure the partner Firestore rules are published.');
      console.error(e);
    } finally { setLoading(false); }
  }, [firestore]);

  useEffect(() => { load(); }, [load]);

  const act = async (uid: string, action: 'suspend' | 'deactivate' | 'reactivate' | 'ban', name: string) => {
    let reason = '';
    if (action === 'ban') {
      if (!window.confirm(`Permanently BAN ${name}? They will be signed out and blocked from logging in. Referral history is kept.`)) return;
      reason = window.prompt('Reason for the ban (sent to the partner):') ?? '';
      if (!reason.trim()) return;
    } else if (action === 'suspend' || action === 'deactivate') {
      reason = window.prompt(action === 'suspend' ? 'Reason for suspending (review):' : 'Reason for temporary deactivation:') ?? '';
      if (!reason.trim()) return;
    } else if (!window.confirm(`Reactivate ${name}?`)) return;

    setBusy(uid);
    try {
      const token = await getToken();
      const res = await fetch('/api/partners/admin/state', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid, action, reason }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed.'); return; }
      setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, accountState: data.accountState, stateReason: reason || null } : r)));
    } catch { alert('Network error.'); }
    finally { setBusy(null); }
  };

  const verifyEmail = async (uid: string, name: string) => {
    if (!window.confirm(`Verify the email for ${name} and grant access? Use this only when you've confirmed the address is theirs.`)) return;
    setVerifying(uid);
    try {
      const token = await getToken();
      const res = await fetch('/api/partners/admin/verify-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed.'); return; }
      setRows((prev) => prev.map((r) => (r.uid === uid ? { ...r, emailVerified: true, accountState: data.accountState ?? r.accountState } : r)));
    } catch { alert('Network error.'); }
    finally { setVerifying(null); }
  };

  const term = q.trim().toLowerCase();
  const shown = rows.filter((r) => {
    const state = r.accountState ?? 'pending_activation';
    return (filter === 'all' || state === filter) &&
      (!term || (r.fullName ?? '').toLowerCase().includes(term) || (r.email ?? '').toLowerCase().includes(term) ||
        (r.username ?? '').toLowerCase().includes(term) || (r.businessName ?? '').toLowerCase().includes(term) || (r.ref ?? '').toLowerCase().includes(term));
  });

  return (
    <div className="mt-5">
      <p className="mb-3 text-sm text-slate-600">All registered partners. Suspend (read-only review), temporarily deactivate (blocks login), reactivate, or permanently ban. History is never deleted.</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, username…" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          {['all', 'active', 'suspended', 'deactivated', 'banned', 'pending_activation'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All states' : STATE_LABEL[s]}</option>)}
        </select>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? <div className="flex items-center gap-2 py-8 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          : shown.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No partners{filter !== 'all' ? ` (${STATE_LABEL[filter]})` : ''}.</p>
          : shown.map((r) => {
            const state = r.accountState ?? 'pending_activation';
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{r.fullName || '—'}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{r.partnerType}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${STATE_TONE[state] ?? STATE_TONE.pending_activation}`}>{STATE_LABEL[state] ?? state}</span>
                      {r.reviewStatus === 'approved' && <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-600">approved</span>}
                      {r.emailVerified
                        ? <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-600"><MailCheck size={11} /> verified</span>
                        : <button disabled={verifying === r.uid} onClick={() => verifyEmail(r.uid, r.fullName || r.email)} className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black text-amber-700 hover:bg-amber-200 disabled:opacity-50">{verifying === r.uid ? <Loader2 size={11} className="animate-spin" /> : <MailX size={11} />} Verify email</button>}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      @{r.username} · {r.email} · {r.phone}{r.businessName ? ` · ${r.businessName}` : ''} · {r.ref}
                    </p>
                    {r.stateReason ? <p className="mt-1 text-xs font-semibold text-orange-600">State note: {r.stateReason}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {state === 'banned' ? (
                      <button disabled={busy === r.uid} onClick={() => act(r.uid, 'reactivate', r.fullName)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"><Play size={13} /> Restore</button>
                    ) : (state === 'suspended' || state === 'deactivated') ? (
                      <button disabled={busy === r.uid} onClick={() => act(r.uid, 'reactivate', r.fullName)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50"><Play size={13} /> Reactivate</button>
                    ) : (
                      <>
                        <button disabled={busy === r.uid} onClick={() => act(r.uid, 'suspend', r.fullName)} className="inline-flex items-center gap-1 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-black text-white hover:bg-amber-600 disabled:opacity-50"><Pause size={13} /> Suspend</button>
                        <button disabled={busy === r.uid} onClick={() => act(r.uid, 'deactivate', r.fullName)} className="inline-flex items-center gap-1 rounded-lg bg-orange-500 px-3 py-1.5 text-xs font-black text-white hover:bg-orange-600 disabled:opacity-50"><Power size={13} /> Deactivate</button>
                      </>
                    )}
                    {state !== 'banned' && (
                      <button disabled={busy === r.uid} onClick={() => act(r.uid, 'ban', r.fullName)} className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-black text-white hover:bg-red-700 disabled:opacity-50"><Ban size={13} /> Ban</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ── Referrals (referred students + mark enrolled) ──────────────────────────── */
const REF_TONE: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600', contacted: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-emerald-100 text-emerald-700', paid: 'bg-teal-100 text-teal-700',
  rewarded: 'bg-violet-100 text-violet-700', rejected: 'bg-red-100 text-red-700',
};
const REF_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', enrolled: 'Enrolled', paid: 'Paid', rewarded: 'Rewarded', rejected: 'Not proceeded',
};
const REF_ENROLLED = ['enrolled', 'paid', 'rewarded'];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Referrals({ getToken, firestore }: { getToken: () => Promise<string>; firestore: any }) {
  const [rows, setRows] = useState<App[]>([]);
  const [partners, setPartners] = useState<Record<string, { fullName?: string; username?: string; ref?: string }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'new' | 'contacted' | 'enrolled' | 'paid' | 'rewarded' | 'rejected'>('all');
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [refSnap, partSnap] = await Promise.all([
        getDocs(query(collection(firestore, 'referrals'), orderBy('createdAt', 'desc'))),
        getDocs(collection(firestore, 'partners')),
      ]);
      const pmap: Record<string, { fullName?: string; username?: string; ref?: string }> = {};
      partSnap.docs.forEach((d) => { const v = d.data(); pmap[d.id] = { fullName: v.fullName, username: v.username, ref: v.ref }; });
      setPartners(pmap);
      setRows(refSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e) {
      setError('Could not load referrals. Make sure the partner Firestore rules are published.');
      console.error(e);
    } finally { setLoading(false); }
  }, [firestore]);

  useEffect(() => { load(); }, [load]);

  const setStatus = async (id: string, status: string, name: string) => {
    if (status === 'rejected' && !window.confirm(`Mark “${name}” as not proceeded?`)) return;
    setBusy(id);
    try {
      const token = await getToken();
      const res = await fetch('/api/partners/admin/referral-status', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id, status }),
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error || 'Failed.'); return; }
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    } catch { alert('Network error.'); }
    finally { setBusy(null); }
  };

  const term = q.trim().toLowerCase();
  const counts: Record<string, number> = {};
  rows.forEach((r) => { const s = r.status ?? 'new'; counts[s] = (counts[s] ?? 0) + 1; });
  const shown = rows.filter((r) => {
    const p = partners[r.partnerUid] ?? {};
    const status = r.status ?? 'new';
    const hay = `${r.studentName ?? ''} ${r.studentContact ?? ''} ${p.fullName ?? ''} ${p.username ?? ''}`.toLowerCase();
    return (filter === 'all' || status === filter) && (!term || hay.includes(term));
  });

  return (
    <div className="mt-5">
      <p className="mb-3 text-sm text-slate-600">Students referred by partners. Mark a student as <b>Enrolled</b> once they sign up with SmartLabs — this credits the partner and counts toward their monthly commission tier.</p>
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student, contact, partner…" className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm focus:border-blue-500 focus:outline-none" />
        </div>
        <select value={filter} onChange={(e) => setFilter(e.target.value as typeof filter)} className="rounded-xl border border-slate-200 px-3 py-2 text-sm">
          {(['all', 'new', 'contacted', 'enrolled', 'paid', 'rewarded', 'rejected'] as const).map((s) => (
            <option key={s} value={s}>{s === 'all' ? `All (${rows.length})` : `${REF_LABEL[s]} (${counts[s] ?? 0})`}</option>
          ))}
        </select>
        <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh</button>
      </div>

      {error && <p className="mt-3 text-sm font-semibold text-red-600">{error}</p>}

      <div className="mt-4 space-y-3">
        {loading ? <div className="flex items-center gap-2 py-8 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>
          : shown.length === 0 ? <p className="py-8 text-center text-sm text-slate-400">No referrals{filter !== 'all' ? ` (${REF_LABEL[filter]})` : ''}.</p>
          : shown.map((r) => {
            const status = r.status ?? 'new';
            const p = partners[r.partnerUid] ?? {};
            const isEnrolled = REF_ENROLLED.includes(status);
            const working = busy === r.id;
            return (
              <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-black text-slate-900">{r.studentName || '—'}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${REF_TONE[status] ?? REF_TONE.new}`}>{REF_LABEL[status] ?? status}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-black uppercase text-slate-500">{r.source ?? 'manual'}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {r.studentContact ? `${r.studentContact} · ` : ''}by {p.fullName ?? 'Unknown partner'}{p.username ? ` (@${p.username})` : ''} · {fmtDate(r.createdAt)}
                    </p>
                    {r.note ? <p className="mt-1 text-xs text-slate-500 line-clamp-2">“{r.note}”</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    {status === 'new' && (
                      <button disabled={working} onClick={() => setStatus(r.id, 'contacted', r.studentName)} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-black text-white hover:bg-blue-700 disabled:opacity-50"><Phone size={13} /> Contacted</button>
                    )}
                    {!isEnrolled && (
                      <button disabled={working} onClick={() => setStatus(r.id, 'enrolled', r.studentName)} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-black text-white hover:bg-emerald-700 disabled:opacity-50">{working ? <Loader2 size={13} className="animate-spin" /> : <GraduationCap size={13} />} Mark enrolled</button>
                    )}
                    {!isEnrolled && status !== 'rejected' && (
                      <button disabled={working} onClick={() => setStatus(r.id, 'rejected', r.studentName)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"><XCircle size={13} /> Not proceeded</button>
                    )}
                    {isEnrolled && (
                      <button disabled={working} onClick={() => setStatus(r.id, 'contacted', r.studentName)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"><Undo2 size={13} /> Undo enrolment</button>
                    )}
                    {status === 'rejected' && (
                      <button disabled={working} onClick={() => setStatus(r.id, 'new', r.studentName)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-200 disabled:opacity-50"><Undo2 size={13} /> Reopen</button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}

/* ── Broadcast / maintenance email ──────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Broadcast({ getToken, firestore }: { getToken: () => Promise<string>; firestore: any }) {
  const [audience, setAudience] = useState<'active' | 'all' | 'one'>('active');
  const [partners, setPartners] = useState<App[]>([]);
  const [uid, setUid] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    getDocs(query(collection(firestore, 'partners'), orderBy('createdAt', 'desc')))
      .then((snap) => setPartners(snap.docs.map((d) => ({ id: d.id, ...d.data() }))))
      .catch(() => { /* one-recipient mode still works via manual selection */ });
  }, [firestore]);

  const send = async () => {
    setResult(null);
    if (!subject.trim() || !body.trim()) { setResult('Subject and message are required.'); return; }
    const count = audience === 'one' ? 1 : audience === 'active' ? partners.filter((p) => (p.accountState ?? '') === 'active').length : partners.length;
    if (!window.confirm(`Send this email to ${audience === 'one' ? 'the selected partner' : `${count} partner(s)`}?`)) return;

    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/partners/admin/broadcast', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ audience, uid: audience === 'one' ? uid : undefined, subject, body }),
      });
      const data = await res.json();
      if (!res.ok) { setResult(data.error || 'Failed to send.'); return; }
      setResult(`Sent to ${data.sent} partner(s)${data.failed ? `, ${data.failed} failed` : ''}.`);
      setSubject(''); setBody('');
    } catch { setResult('Network error.'); }
    finally { setBusy(false); }
  };

  const inp = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';
  return (
    <div className="mt-5">
      <p className="mb-4 flex items-center gap-2 text-sm text-slate-600"><Megaphone size={16} className="text-blue-600" /> Email partners — maintenance notices, rule changes, or a direct message. Each partner receives their own email.</p>
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6">
        <div>
          <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Audience</span>
          <div className="flex flex-wrap gap-2">
            {(['active', 'all', 'one'] as const).map((a) => (
              <button key={a} onClick={() => setAudience(a)} className={`rounded-xl border px-4 py-2 text-sm font-bold ${audience === a ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                {a === 'active' ? 'Active partners' : a === 'all' ? 'All partners' : 'One partner'}
              </button>
            ))}
          </div>
        </div>
        {audience === 'one' && (
          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Partner</span>
            <select value={uid} onChange={(e) => setUid(e.target.value)} className={inp}>
              <option value="">Select a partner…</option>
              {partners.map((p) => <option key={p.uid} value={p.uid}>{p.fullName} · @{p.username} · {p.email}</option>)}
            </select>
          </label>
        )}
        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} className={inp} placeholder="e.g. Scheduled maintenance this weekend" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Message</span><textarea value={body} onChange={(e) => setBody(e.target.value)} rows={7} className={inp} placeholder="Write your message. Line breaks are preserved." /></label>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={send} disabled={busy} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">{busy ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Send</button>
          {result && <span className="text-sm font-bold text-slate-700">{result}</span>}
        </div>
      </div>
    </div>
  );
}

/* ── Commission settings ────────────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Commission({ firestore }: { firestore: any }) {
  const [s, setS] = useState<CommissionSettings>(BLANK);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getDoc(doc(firestore, 'partner_settings', 'commission'))
      .then((snap) => { if (snap.exists()) setS({ ...BLANK, ...(snap.data() as CommissionSettings) }); })
      .finally(() => setLoading(false));
  }, [firestore]);

  const rates = s.rates ?? [];
  const setRate = (i: number, k: keyof CommissionRate, v: string) => setS((p) => ({ ...p, rates: (p.rates ?? []).map((r, j) => (j === i ? { ...r, [k]: v } : r)) }));
  const addRate = () => setS((p) => ({ ...p, rates: [...(p.rates ?? []), { label: '', value: '', note: '' }] }));
  const delRate = (i: number) => setS((p) => ({ ...p, rates: (p.rates ?? []).filter((_, j) => j !== i) }));

  const save = async () => {
    setSaving(true); setSaved(false);
    try {
      await setDoc(doc(firestore, 'partner_settings', 'commission'), {
        enabled: !!s.enabled, headline: (s.headline ?? '').trim(), description: (s.description ?? '').trim(), footnote: (s.footnote ?? '').trim(),
        rates: (s.rates ?? []).filter((r) => r.label.trim() && r.value.trim()).map((r) => ({ label: r.label.trim(), value: r.value.trim(), note: (r.note ?? '').trim() })),
        updatedAt: serverTimestamp(),
      }, { merge: true });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch (e) { alert('Could not save: ' + (e instanceof Error ? e.message : 'unknown error')); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center gap-2 py-8 text-slate-400"><Loader2 size={16} className="animate-spin" /> Loading…</div>;
  const inp = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  return (
    <div className="mt-5">
      <p className="mb-4 flex items-center gap-2 text-sm text-slate-600"><Coins size={16} className="text-emerald-600" /> Set what partners can earn. Shows on the public <Link href="/partners" className="font-bold text-blue-600 hover:underline">partner page</Link> only when enabled.</p>
      <div className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6">
        <label className="flex items-center gap-3"><input type="checkbox" checked={!!s.enabled} onChange={(e) => setS((p) => ({ ...p, enabled: e.target.checked }))} className="h-5 w-5" /><span className="text-sm font-black">Show the “Earn from referrals” section</span></label>
        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Headline</span><input value={s.headline ?? ''} onChange={(e) => setS((p) => ({ ...p, headline: e.target.value }))} className={inp} placeholder="e.g. Earn when your referrals enrol" /></label>
        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Description</span><textarea value={s.description ?? ''} onChange={(e) => setS((p) => ({ ...p, description: e.target.value }))} rows={2} className={inp} /></label>
        <div>
          <div className="mb-2 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wide text-slate-500">Commission rates</span><button onClick={addRate} className="inline-flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black text-white hover:bg-slate-800"><Plus size={13} /> Add rate</button></div>
          <div className="space-y-2">
            {rates.length === 0 && <p className="text-xs text-slate-400">No rates yet — e.g. Individual · 10% · per enrolment.</p>}
            {rates.map((r, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 p-2">
                <input value={r.value} onChange={(e) => setRate(i, 'value', e.target.value)} placeholder="10%" className={`${inp} w-20`} />
                <input value={r.label} onChange={(e) => setRate(i, 'label', e.target.value)} placeholder="Label" className={`${inp} flex-1 min-w-[120px]`} />
                <input value={r.note ?? ''} onChange={(e) => setRate(i, 'note', e.target.value)} placeholder="Note" className={`${inp} flex-1 min-w-[120px]`} />
                <button onClick={() => delRate(i)} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"><Trash2 size={15} /></button>
              </div>
            ))}
          </div>
        </div>
        <label className="block"><span className="mb-1.5 block text-xs font-black uppercase tracking-wide text-slate-500">Footnote / terms</span><input value={s.footnote ?? ''} onChange={(e) => setS((p) => ({ ...p, footnote: e.target.value }))} className={inp} /></label>
        <div className="flex items-center gap-3 pt-1">
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-50">{saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save</button>
          {saved && <span className="inline-flex items-center gap-1 text-sm font-bold text-emerald-600"><CheckCircle2 size={16} /> Saved</span>}
        </div>
      </div>
    </div>
  );
}
