'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  LayoutDashboard, Users, Share2, Coins, UserCog, Copy, Check, Link2, Plus,
  Loader2, TrendingUp, Sparkles, Crown, MessageCircle, Mail, Save,
} from 'lucide-react';

interface PartnerDoc {
  fullName?: string; phone?: string; location?: string; address?: string;
  partnerType?: string; businessName?: string; website?: string;
  referralCode?: string; counters?: { referred?: number; enrolled?: number; rewarded?: number };
}
interface Referral {
  id: string; studentName?: string; studentContact?: string; note?: string;
  source?: string; status?: string; createdAt?: { toDate?: () => Date }; code?: string;
}

const STATUS_TONE: Record<string, string> = {
  new: 'bg-slate-100 text-slate-600', contacted: 'bg-blue-100 text-blue-700',
  enrolled: 'bg-emerald-100 text-emerald-700', paid: 'bg-teal-100 text-teal-700',
  rewarded: 'bg-violet-100 text-violet-700', rejected: 'bg-red-100 text-red-700',
};
const STATUS_LABEL: Record<string, string> = {
  new: 'New', contacted: 'Contacted', enrolled: 'Enrolled', paid: 'Paid', rewarded: 'Rewarded', rejected: 'Not proceeded',
};
const ENROLLED = ['enrolled', 'paid', 'rewarded'];
const fmtDate = (v: { toDate?: () => Date } | undefined) => { try { return v?.toDate ? v.toDate().toLocaleDateString() : '—'; } catch { return '—'; } };
const inMonth = (v: { toDate?: () => Date } | undefined) => { try { const d = v?.toDate?.(); if (!d) return false; const n = new Date(); return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth(); } catch { return false; } };

const TIERS = [
  { min: 0, max: 10, rate: 10, label: '1–10 students', icon: TrendingUp },
  { min: 10, max: 20, rate: 12, label: '11–20 students', icon: Sparkles },
  { min: 20, max: Infinity, rate: 15, label: '20+ students', icon: Crown },
];
const tierFor = (n: number) => (n > 20 ? TIERS[2] : n > 10 ? TIERS[1] : TIERS[0]);

const field = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function WorkspaceDashboard({ user, firestore, partner }: { user: User; firestore: import('firebase/firestore').Firestore; partner: PartnerDoc }) {
  const [tab, setTab] = useState<'overview' | 'referrals' | 'share' | 'earnings' | 'profile'>('overview');
  const [code, setCode] = useState<string | null>(partner.referralCode ?? null);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const link = code ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.smartlabs.lk'}/r/${code}` : '';

  // Lazily assign / fetch the referral code.
  useEffect(() => {
    if (code) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/partners/referral-code', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.code) setCode(data.code);
      } catch { /* code stays null; Share tab shows a hint */ }
    })();
  }, [code, user]);

  const loadRefs = useCallback(async () => {
    setLoadingRefs(true);
    try {
      const snap = await getDocs(query(collection(firestore, 'referrals'), where('partnerUid', '==', user.uid)));
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Referral, 'id'>) }));
      rows.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() ?? 0) - (a.createdAt?.toDate?.()?.getTime() ?? 0));
      setRefs(rows);
    } catch (e) { console.error(e); }
    finally { setLoadingRefs(false); }
  }, [firestore, user]);

  useEffect(() => { loadRefs(); }, [loadRefs]);

  const stats = useMemo(() => {
    const active = refs.filter((r) => r.status !== 'rejected');
    const enrolled = refs.filter((r) => ENROLLED.includes(r.status ?? ''));
    const rewarded = refs.filter((r) => r.status === 'rewarded');
    const monthEnrolled = enrolled.filter((r) => inMonth(r.createdAt)).length;
    return { referred: active.length, enrolled: enrolled.length, rewarded: rewarded.length, monthEnrolled };
  }, [refs]);

  const TABS = [
    { k: 'overview', label: 'Overview', icon: LayoutDashboard },
    { k: 'referrals', label: 'My Referrals', icon: Users },
    { k: 'share', label: 'Share', icon: Share2 },
    { k: 'earnings', label: 'Earnings', icon: Coins },
    { k: 'profile', label: 'Profile', icon: UserCog },
  ] as const;

  return (
    <div className="mt-6">
      {/* Tabs */}
      <div className="flex flex-wrap gap-1 rounded-2xl border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-black transition-colors ${tab === t.k ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <Overview stats={stats} link={link} refs={refs} loading={loadingRefs} />}
      {tab === 'referrals' && <ReferralsTab refs={refs} loading={loadingRefs} reload={loadRefs} user={user} onAdded={loadRefs} />}
      {tab === 'share' && <ShareTab link={link} code={code} name={partner.fullName ?? ''} user={user} onAdded={loadRefs} />}
      {tab === 'earnings' && <EarningsTab monthEnrolled={stats.monthEnrolled} />}
      {tab === 'profile' && <ProfileTab partner={partner} user={user} />}
    </div>
  );
}

/* ── Copy helper ─────────────────────────────────────────────────────────────── */
function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ } }}
      className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-black text-white hover:bg-slate-800">
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? 'Copied' : label}
    </button>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────────── */
function Overview({ stats, link, refs, loading }: { stats: { referred: number; enrolled: number; rewarded: number; monthEnrolled: number }; link: string; refs: Referral[]; loading: boolean }) {
  const tier = tierFor(stats.monthEnrolled);
  const cards = [
    { label: 'Referred', value: stats.referred, tone: 'text-slate-900' },
    { label: 'Enrolled', value: stats.enrolled, tone: 'text-emerald-600' },
    { label: 'Rewarded', value: stats.rewarded, tone: 'text-violet-600' },
  ];
  return (
    <div className="mt-5 space-y-5">
      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-3xl border border-slate-200 bg-white p-6">
            <div className="text-xs font-black uppercase tracking-wide text-slate-400">{c.label}</div>
            <div className={`mt-1 text-4xl font-black ${c.tone}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Current tier + link */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-blue-50 to-white p-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-blue-600"><tier.icon size={15} /> This month’s tier</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black text-slate-900">{tier.rate}%</span>
            <span className="mb-1 text-sm font-bold text-slate-500">commission</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">{stats.monthEnrolled} enrolment(s) this month · {tier.label}. Tiers reset monthly.</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400"><Link2 size={15} /> Your referral link</div>
          {link ? (
            <>
              <div className="mt-2 truncate rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">{link}</div>
              <div className="mt-3"><CopyButton text={link} label="Copy link" /></div>
            </>
          ) : <p className="mt-2 text-sm text-slate-400">Preparing your link…</p>}
        </div>
      </div>

      {/* Recent */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="mb-3 text-sm font-black text-slate-900">Recent referrals</div>
        {loading ? <div className="flex items-center gap-2 py-4 text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</div>
          : refs.length === 0 ? <p className="py-4 text-sm text-slate-400">No referrals yet. Share your link or add one from the Share tab.</p>
          : (
            <div className="space-y-2">
              {refs.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
                  <div className="min-w-0"><div className="truncate text-sm font-bold text-slate-800">{r.studentName}</div><div className="text-xs text-slate-400">{r.source} · {fmtDate(r.createdAt)}</div></div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${STATUS_TONE[r.status ?? 'new']}`}>{STATUS_LABEL[r.status ?? 'new']}</span>
                </div>
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

/* ── My Referrals ────────────────────────────────────────────────────────────── */
function ReferralsTab({ refs, loading }: { refs: Referral[]; loading: boolean; reload: () => void; user: User; onAdded: () => void }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const term = q.trim().toLowerCase();
  const shown = refs.filter((r) => (filter === 'all' || r.status === filter) && (!term || (r.studentName ?? '').toLowerCase().includes(term)));

  return (
    <div className="mt-5">
      <div className="flex flex-wrap items-center gap-2">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student name…" className={`${field} flex-1 min-w-[180px]`} />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm">
          {['all', 'new', 'contacted', 'enrolled', 'paid', 'rewarded', 'rejected'].map((s) => <option key={s} value={s}>{s === 'all' ? 'All statuses' : STATUS_LABEL[s]}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-hidden rounded-3xl border border-slate-200 bg-white">
        {loading ? <div className="flex items-center gap-2 p-6 text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</div>
          : shown.length === 0 ? <p className="p-6 text-center text-sm text-slate-400">No referrals{filter !== 'all' ? ` (${STATUS_LABEL[filter]})` : ''} yet.</p>
          : (
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-100 bg-slate-50 text-[11px] font-black uppercase tracking-wide text-slate-400">
                <tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Source</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Date</th></tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3"><div className="font-bold text-slate-800">{r.studentName}</div>{r.studentContact ? <div className="text-xs text-slate-400">{r.studentContact}</div> : null}</td>
                    <td className="px-4 py-3 text-slate-500">{r.source}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-black ${STATUS_TONE[r.status ?? 'new']}`}>{STATUS_LABEL[r.status ?? 'new']}</span></td>
                    <td className="px-4 py-3 text-slate-500">{fmtDate(r.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>
      <p className="mt-3 text-xs text-slate-400">Referral statuses are updated by the SmartLabs team as students progress.</p>
    </div>
  );
}

/* ── Share (link + manual referral) ──────────────────────────────────────────── */
function ShareTab({ link, code, name, user, onAdded }: { link: string; code: string | null; name: string; user: User; onAdded: () => void }) {
  const [form, setForm] = useState({ studentName: '', studentContact: '', note: '', consent: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const blurb = link ? `Hi! I recommend SmartLabs for PTE & IELTS prep. Register through my partner link: ${link}` : '';
  const waHref = `https://wa.me/?text=${encodeURIComponent(blurb)}`;
  const mailHref = `mailto:?subject=${encodeURIComponent('SmartLabs — PTE & IELTS preparation')}&body=${encodeURIComponent(blurb)}`;

  const submit = async () => {
    setMsg(null);
    if (form.studentName.trim().length < 2) { setMsg({ ok: false, text: 'Student name is required.' }); return; }
    if (!form.studentContact.trim()) { setMsg({ ok: false, text: 'A phone or email is required.' }); return; }
    if (!form.consent) { setMsg({ ok: false, text: 'Please confirm the student agreed to be referred.' }); return; }
    setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/partners/referrals/create', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.error || 'Could not add referral.' }); return; }
      setMsg({ ok: true, text: 'Referral added and tracked.' });
      setForm({ studentName: '', studentContact: '', note: '', consent: false });
      onAdded();
    } catch { setMsg({ ok: false, text: 'Network error.' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="text-sm font-black text-slate-900">Your referral link</div>
        {link ? (
          <>
            <div className="mt-2 break-all rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">{link}</div>
            <div className="mt-3 flex flex-wrap gap-2">
              <CopyButton text={link} label="Copy link" />
              <a href={waHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-black text-white hover:bg-emerald-700"><MessageCircle size={14} /> WhatsApp</a>
              <a href={mailHref} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-black text-slate-700 hover:bg-slate-50"><Mail size={14} /> Email</a>
            </div>
            <p className="mt-3 text-xs text-slate-400">Share code: <span className="font-black text-slate-600">{code}</span>. Anyone who registers through your link is credited to you.</p>
          </>
        ) : <p className="mt-2 text-sm text-slate-400">Preparing your link…</p>}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-2 text-sm font-black text-slate-900"><Plus size={16} className="text-blue-600" /> Refer a student manually</div>
        <p className="mt-1 text-xs text-slate-500">Add someone you’ve spoken to. Only add contact details with their consent.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={form.studentName} onChange={(e) => setForm({ ...form, studentName: e.target.value })} placeholder="Student name *" className={field} />
          <input value={form.studentContact} onChange={(e) => setForm({ ...form, studentContact: e.target.value })} placeholder="Phone or email *" className={field} />
          <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Note (optional)" className={`${field} sm:col-span-2`} />
        </div>
        <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
          <input type="checkbox" checked={form.consent} onChange={(e) => setForm({ ...form, consent: e.target.checked })} className="mt-0.5 h-4 w-4" />
          <span>I confirm this student agreed to be referred to SmartLabs and to be contacted.</span>
        </label>
        {msg && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
        <button onClick={submit} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add referral
        </button>
      </div>
    </div>
  );
}

/* ── Earnings ────────────────────────────────────────────────────────────────── */
function EarningsTab({ monthEnrolled }: { monthEnrolled: number }) {
  const current = tierFor(monthEnrolled);
  return (
    <div className="mt-5 space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="text-xs font-black uppercase tracking-wide text-emerald-600">Your current rate this month</div>
        <div className="mt-1 text-4xl font-black text-slate-900">{current.rate}%</div>
        <p className="mt-1 text-sm text-slate-500">{monthEnrolled} enrolment(s) so far · {current.label}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {TIERS.map((t, i) => {
          const active = t.rate === current.rate;
          return (
            <div key={i} className={`rounded-3xl border p-6 ${active ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><t.icon size={18} /></div>
              <div className="text-3xl font-black text-slate-900">{t.rate}%</div>
              <div className="mt-1 text-sm font-bold text-slate-600">{t.label}</div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-xs leading-relaxed text-slate-400">
        Commission is calculated per bracket (1–10 @ 10%, 11–20 @ 12%, 20+ @ 15%) on confirmed enrolments and
        resets monthly. Payouts follow your partner agreement and are processed by SmartLabs.
      </p>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────────────── */
function ProfileTab({ partner, user }: { partner: PartnerDoc; user: User }) {
  const isBiz = partner.partnerType === 'business';
  const [form, setForm] = useState({
    fullName: partner.fullName ?? '', phone: partner.phone ?? '', location: partner.location ?? '',
    address: partner.address ?? '', businessName: partner.businessName ?? '', website: partner.website ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async () => {
    setMsg(null); setSaving(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/partners/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setMsg({ ok: false, text: data.error || 'Could not save.' }); return; }
      setMsg({ ok: true, text: 'Profile updated.' });
    } catch { setMsg({ ok: false, text: 'Network error.' }); }
    finally { setSaving(false); }
  };

  return (
    <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-6">
      <div className="text-sm font-black text-slate-900">Your details</div>
      <p className="mt-1 text-xs text-slate-500">Keep your contact details up to date. Username and email can’t be changed here.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="block"><span className="text-xs font-bold text-slate-600">Full name *</span><input className={`mt-1 ${field}`} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Phone *</span><input className={`mt-1 ${field}`} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">District / city *</span><input className={`mt-1 ${field}`} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
        <label className="block"><span className="text-xs font-bold text-slate-600">Address</span><input className={`mt-1 ${field}`} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></label>
        {isBiz && (
          <>
            <label className="block"><span className="text-xs font-bold text-slate-600">Business name *</span><input className={`mt-1 ${field}`} value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} /></label>
            <label className="block"><span className="text-xs font-bold text-slate-600">Website</span><input className={`mt-1 ${field}`} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} /></label>
          </>
        )}
      </div>
      {msg && <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-semibold ${msg.ok ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{msg.text}</p>}
      <button onClick={save} disabled={saving} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60">
        {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
      </button>
    </div>
  );
}
