'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import {
  LayoutDashboard, Users, Share2, Coins, UserCog, Copy, Check, Link2, Plus,
  Loader2, TrendingUp, Sparkles, Crown, MessageCircle, Mail, Save, Send,
  Target, Calendar, Hash, AtSign, BadgeCheck, Wallet, RefreshCw, Calculator,
} from 'lucide-react';

interface PartnerDoc {
  fullName?: string; phone?: string; location?: string; address?: string;
  partnerType?: string; businessName?: string; website?: string;
  username?: string; email?: string; ref?: string;
  referralCode?: string; counters?: { referred?: number; enrolled?: number; rewarded?: number };
  createdAt?: { toDate?: () => Date };
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
const LKR = (n: number) => 'LKR ' + Math.round(n).toLocaleString('en-LK');

const TIERS = [
  { min: 0, max: 10, rate: 10, label: '1–10 students', icon: TrendingUp },
  { min: 10, max: 20, rate: 12, label: '11–20 students', icon: Sparkles },
  { min: 20, max: Infinity, rate: 15, label: '20+ students', icon: Crown },
];
const tierFor = (n: number) => (n > 20 ? TIERS[2] : n > 10 ? TIERS[1] : TIERS[0]);
// Progress toward the next tier threshold (returns null at the top tier).
function nextTier(n: number): { needed: number; rate: number; pct: number } | null {
  if (n >= 20) return null;
  const threshold = n < 10 ? 10 : 20;
  const base = n < 10 ? 0 : 10;
  const rate = n < 10 ? 12 : 15;
  return { needed: threshold - n, rate, pct: Math.min(100, Math.round(((n - base) / (threshold - base)) * 100)) };
}
function marginalEarnings(students: number, avgValue: number) {
  const t1 = Math.min(students, 10), t2 = Math.min(Math.max(students - 10, 0), 10), t3 = Math.max(students - 20, 0);
  return avgValue * (t1 * 0.10 + t2 * 0.12 + t3 * 0.15);
}

const field = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100';

export function WorkspaceDashboard({ user, firestore, partner }: { user: User; firestore: import('firebase/firestore').Firestore; partner: PartnerDoc }) {
  const [tab, setTab] = useState<'overview' | 'referrals' | 'share' | 'earnings' | 'profile'>('overview');
  const [code, setCode] = useState<string | null>(partner.referralCode ?? null);
  const [refs, setRefs] = useState<Referral[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);

  const link = code ? `${typeof window !== 'undefined' ? window.location.origin : 'https://www.smartlabs.lk'}/r/${code}` : '';

  useEffect(() => {
    if (code) return;
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/partners/referral-code', { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
        const data = await res.json();
        if (res.ok && data.code) setCode(data.code);
      } catch { /* Share tab shows a hint */ }
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
    const monthReferred = active.filter((r) => inMonth(r.createdAt)).length;
    const byStatus: Record<string, number> = {};
    refs.forEach((r) => { const s = r.status ?? 'new'; byStatus[s] = (byStatus[s] ?? 0) + 1; });
    return { referred: active.length, enrolled: enrolled.length, rewarded: rewarded.length, monthEnrolled, monthReferred, byStatus };
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
      {/* Hero summary */}
      <HeroSummary stats={stats} refs={refs} onRefresh={loadRefs} loading={loadingRefs} />

      {/* Scrollable tab bar (mobile-friendly) */}
      <div className="mt-5 -mx-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-1 rounded-2xl border border-slate-200 bg-white p-1">
          {TABS.map((t) => (
            <button key={t.k} onClick={() => setTab(t.k)}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-black transition-colors sm:text-sm ${tab === t.k ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
              <t.icon size={15} /> <span className="hidden sm:inline">{t.label}</span><span className="sm:hidden">{t.label.split(' ')[0]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5">
        {tab === 'overview' && <Overview stats={stats} link={link} refs={refs} loading={loadingRefs} onGoShare={() => setTab('share')} />}
        {tab === 'referrals' && <ReferralsTab refs={refs} loading={loadingRefs} byStatus={stats.byStatus} />}
        {tab === 'share' && <ShareTab link={link} code={code} user={user} onAdded={loadRefs} />}
        {tab === 'earnings' && <EarningsTab monthEnrolled={stats.monthEnrolled} />}
        {tab === 'profile' && <ProfileTab partner={partner} user={user} code={code} />}
      </div>
    </div>
  );
}

/* ── Hero summary with tier progress ─────────────────────────────────────────── */
function HeroSummary({ stats, onRefresh, loading }: { stats: { referred: number; enrolled: number; rewarded: number; monthEnrolled: number; monthReferred: number }; refs: Referral[]; onRefresh: () => void; loading: boolean }) {
  const tier = tierFor(stats.monthEnrolled);
  const next = nextTier(stats.monthEnrolled);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 p-5 text-white sm:p-6">
      <div className="pointer-events-none absolute inset-0 opacity-70" style={{ background: 'radial-gradient(60% 80% at 100% 0%, rgba(59,130,246,.25), transparent 70%)' }} />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-300"><tier.icon size={14} /> This month’s tier</div>
          <div className="mt-1 flex items-end gap-2">
            <span className="bg-gradient-to-br from-white to-slate-400 bg-clip-text text-4xl font-black text-transparent sm:text-5xl">{tier.rate}%</span>
            <span className="mb-1 text-sm font-bold text-slate-400">commission</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{stats.monthEnrolled} enrolment(s) this month · {tier.label}</p>
        </div>
        <button onClick={onRefresh} className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/10">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* progress to next tier */}
      <div className="relative mt-5">
        {next ? (
          <>
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
              <span>Progress to {next.rate}%</span>
              <span>{next.needed} more enrolment(s)</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all" style={{ width: `${next.pct}%` }} />
            </div>
          </>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-black text-amber-300"><Crown size={13} /> Top tier reached this month</div>
        )}
      </div>
    </div>
  );
}

/* ── Copy helpers ────────────────────────────────────────────────────────────── */
function CopyButton({ text, label = 'Copy', full = false }: { text: string; label?: string; full?: boolean }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* ignore */ } }}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-black text-white hover:bg-slate-800 ${full ? 'w-full' : ''}`}>
      {done ? <Check size={14} /> : <Copy size={14} />} {done ? 'Copied' : label}
    </button>
  );
}

/* ── Overview ────────────────────────────────────────────────────────────────── */
function Overview({ stats, link, refs, loading, onGoShare }: { stats: { referred: number; enrolled: number; rewarded: number; byStatus: Record<string, number> }; link: string; refs: Referral[]; loading: boolean; onGoShare: () => void }) {
  const cards = [
    { label: 'Referred', value: stats.referred, icon: Users, tone: 'text-slate-900', bg: 'bg-slate-50 text-slate-500' },
    { label: 'Enrolled', value: stats.enrolled, icon: BadgeCheck, tone: 'text-emerald-600', bg: 'bg-emerald-50 text-emerald-600' },
    { label: 'Rewarded', value: stats.rewarded, icon: Wallet, tone: 'text-violet-600', bg: 'bg-violet-50 text-violet-600' },
  ];
  const dist = ['new', 'contacted', 'enrolled', 'paid', 'rewarded', 'rejected'].filter((s) => stats.byStatus[s]);
  return (
    <div className="space-y-5">
      {/* Counters — 3-up even on mobile */}
      <div className="grid grid-cols-3 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
            <div className={`mb-2 inline-flex h-8 w-8 items-center justify-center rounded-xl ${c.bg}`}><c.icon size={16} /></div>
            <div className={`text-2xl font-black sm:text-3xl ${c.tone}`}>{c.value}</div>
            <div className="text-[11px] font-black uppercase tracking-wide text-slate-400">{c.label}</div>
          </div>
        ))}
      </div>

      {/* Referral link */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400"><Link2 size={15} /> Your referral link</div>
        {link ? (
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1 truncate rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-bold text-slate-700">{link}</div>
            <div className="flex gap-2">
              <CopyButton text={link} label="Copy" />
              <button onClick={onGoShare} className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-black text-white hover:bg-blue-700"><Share2 size={14} /> Share</button>
            </div>
          </div>
        ) : <p className="mt-2 text-sm text-slate-400">Preparing your link…</p>}
      </div>

      {/* Status distribution */}
      {dist.length > 0 && (
        <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="mb-3 text-sm font-black text-slate-900">Referral breakdown</div>
          <div className="flex flex-wrap gap-2">
            {dist.map((s) => (
              <span key={s} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-black ${STATUS_TONE[s]}`}>
                {STATUS_LABEL[s]} <span className="rounded-full bg-white/60 px-1.5">{stats.byStatus[s]}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-3 text-sm font-black text-slate-900">Recent referrals</div>
        {loading ? <div className="flex items-center gap-2 py-4 text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</div>
          : refs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 py-8 text-center">
              <p className="text-sm text-slate-400">No referrals yet.</p>
              <button onClick={onGoShare} className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white hover:bg-blue-700"><Plus size={14} /> Add your first referral</button>
            </div>
          ) : (
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

/* ── My Referrals (responsive: table on desktop, cards on mobile) ────────────── */
function ReferralsTab({ refs, loading, byStatus }: { refs: Referral[]; loading: boolean; byStatus: Record<string, number> }) {
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const term = q.trim().toLowerCase();
  const shown = refs.filter((r) => (filter === 'all' || r.status === filter) && (!term || (r.studentName ?? '').toLowerCase().includes(term)));
  const chips = ['all', 'new', 'contacted', 'enrolled', 'paid', 'rewarded', 'rejected'];

  return (
    <div>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search student name…" className={field} />
      {/* status chips */}
      <div className="mt-3 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {chips.map((s) => {
          const n = s === 'all' ? refs.length : (byStatus[s] ?? 0);
          return (
            <button key={s} onClick={() => setFilter(s)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-black transition-colors ${filter === s ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}>
              {s === 'all' ? 'All' : STATUS_LABEL[s]} <span className={`rounded-full px-1.5 ${filter === s ? 'bg-white/20' : 'bg-slate-100'}`}>{n}</span>
            </button>
          );
        })}
      </div>

      {loading ? <div className="mt-4 flex items-center gap-2 rounded-3xl border border-slate-200 bg-white p-6 text-slate-400"><Loader2 size={15} className="animate-spin" /> Loading…</div>
        : shown.length === 0 ? <p className="mt-4 rounded-3xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400">No referrals{filter !== 'all' ? ` (${STATUS_LABEL[filter]})` : ''} yet.</p>
        : (
          <>
            {/* Desktop table */}
            <div className="mt-4 hidden overflow-hidden rounded-3xl border border-slate-200 bg-white sm:block">
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
            </div>
            {/* Mobile cards */}
            <div className="mt-4 space-y-2.5 sm:hidden">
              {shown.map((r) => (
                <div key={r.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-black text-slate-900">{r.studentName}</div>
                      {r.studentContact ? <div className="truncate text-xs text-slate-400">{r.studentContact}</div> : null}
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-black ${STATUS_TONE[r.status ?? 'new']}`}>{STATUS_LABEL[r.status ?? 'new']}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-xs text-slate-400"><span className="capitalize">{r.source}</span> · <span>{fmtDate(r.createdAt)}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      <p className="mt-3 text-xs text-slate-400">Statuses are updated by the SmartLabs team as students progress.</p>
    </div>
  );
}

/* ── Share ───────────────────────────────────────────────────────────────────── */
function ShareTab({ link, code, user, onAdded }: { link: string; code: string | null; user: User; onAdded: () => void }) {
  const [form, setForm] = useState({ studentName: '', studentContact: '', note: '', consent: false });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const defaultMsg = link ? `Hi! I recommend SmartLabs for PTE & IELTS prep. Register through my link: ${link}` : '';
  const [shareMsg, setShareMsg] = useState('');
  const text = (shareMsg || defaultMsg);

  const enc = encodeURIComponent(text);
  const encLink = encodeURIComponent(link);
  const channels = [
    { name: 'WhatsApp', href: `https://wa.me/?text=${enc}`, cls: 'bg-emerald-600 hover:bg-emerald-700', icon: MessageCircle },
    { name: 'Telegram', href: `https://t.me/share/url?url=${encLink}&text=${enc}`, cls: 'bg-sky-500 hover:bg-sky-600', icon: Send },
    { name: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encLink}`, cls: 'bg-blue-700 hover:bg-blue-800', icon: Share2 },
    { name: 'Email', href: `mailto:?subject=${encodeURIComponent('SmartLabs — PTE & IELTS preparation')}&body=${enc}`, cls: 'bg-slate-700 hover:bg-slate-800', icon: Mail },
  ];

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
    <div className="space-y-5">
      {/* Link + code */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="text-sm font-black text-slate-900">Your referral link</div>
        {link ? (
          <>
            <div className="mt-2 break-all rounded-xl bg-slate-50 px-3 py-3 text-sm font-bold text-slate-700">{link}</div>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
              <CopyButton text={link} label="Copy link" />
              <CopyButton text={code ?? ''} label={`Code ${code ?? ''}`} />
            </div>
            <div className="mt-4 text-xs font-black uppercase tracking-wide text-slate-400">Share on</div>
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {channels.map((c) => (
                <a key={c.name} href={c.href} target="_blank" rel="noopener noreferrer" className={`inline-flex items-center justify-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-black text-white ${c.cls}`}>
                  <c.icon size={14} /> {c.name}
                </a>
              ))}
            </div>
            <label className="mt-4 block">
              <span className="text-xs font-black uppercase tracking-wide text-slate-400">Message (editable)</span>
              <textarea rows={3} value={shareMsg} onChange={(e) => setShareMsg(e.target.value)} placeholder={defaultMsg} className={`mt-1.5 ${field}`} />
            </label>
            <p className="mt-2 text-xs text-slate-400">Anyone who registers through your link is credited to you automatically.</p>
          </>
        ) : <p className="mt-2 text-sm text-slate-400">Preparing your link…</p>}
      </div>

      {/* Manual referral */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
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
        <button onClick={submit} disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white hover:bg-blue-700 disabled:opacity-60 sm:w-auto">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />} Add referral
        </button>
      </div>
    </div>
  );
}

/* ── Earnings (with estimator) ───────────────────────────────────────────────── */
function EarningsTab({ monthEnrolled }: { monthEnrolled: number }) {
  const current = tierFor(monthEnrolled);
  const [students, setStudents] = useState(Math.max(monthEnrolled, 12));
  const [avg, setAvg] = useState(25000);
  const earnings = useMemo(() => marginalEarnings(students, avg), [students, avg]);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-5 sm:p-6">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-emerald-600"><Coins size={14} /> Your current rate this month</div>
        <div className="mt-1 text-4xl font-black text-slate-900">{current.rate}%</div>
        <p className="mt-1 text-sm text-slate-500">{monthEnrolled} enrolment(s) so far · {current.label}</p>
      </div>

      {/* Tier ladder */}
      <div className="grid gap-3 sm:grid-cols-3">
        {TIERS.map((t, i) => {
          const active = t.rate === current.rate;
          return (
            <div key={i} className={`rounded-3xl border p-5 ${active ? 'border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-200' : 'border-slate-200 bg-white'}`}>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600"><t.icon size={18} /></div>
              <div className="text-3xl font-black text-slate-900">{t.rate}%</div>
              <div className="mt-1 text-sm font-bold text-slate-600">{t.label}</div>
              {active && <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-700"><Target size={11} /> You are here</div>}
            </div>
          );
        })}
      </div>

      {/* Estimator */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-4 inline-flex items-center gap-2 text-sm font-black text-slate-900"><Calculator size={16} className="text-blue-600" /> Estimate a month’s earnings</div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wide text-slate-400"><span>Students / month</span><span className="text-slate-900">{students}</span></div>
            <input type="range" min={1} max={40} value={students} onChange={(e) => setStudents(+e.target.value)} className="mt-3 w-full accent-blue-600" />
          </div>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-wide text-slate-400">Avg. course value (LKR)</span>
            <input type="number" min={0} step={1000} value={avg} onChange={(e) => setAvg(Math.max(0, +e.target.value))} className={`mt-2 ${field}`} />
          </label>
        </div>
        <div className="mt-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-4 ring-1 ring-emerald-100">
          <div className="text-xs font-black uppercase tracking-wide text-emerald-600">Estimated monthly commission</div>
          <div className="mt-1 text-3xl font-black text-slate-900">{LKR(earnings)}</div>
        </div>
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          Calculated per bracket (1–10 @ 10%, 11–20 @ 12%, 20+ @ 15%) on confirmed enrolments; tiers reset monthly.
          Illustration only — payouts follow your partner agreement and are processed by SmartLabs.
        </p>
      </div>
    </div>
  );
}

/* ── Profile ─────────────────────────────────────────────────────────────────── */
function ProfileTab({ partner, user, code }: { partner: PartnerDoc; user: User; code: string | null }) {
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

  const summary = [
    { icon: AtSign, label: 'Username', value: partner.username ? `@${partner.username}` : '—' },
    { icon: Mail, label: 'Email', value: partner.email ?? user.email ?? '—' },
    { icon: Hash, label: 'Reference', value: partner.ref ?? '—' },
    { icon: Link2, label: 'Referral code', value: code ?? '—' },
    { icon: UserCog, label: 'Type', value: isBiz ? 'Business' : 'Individual' },
    { icon: Calendar, label: 'Member since', value: fmtDate(partner.createdAt) },
  ];

  return (
    <div className="space-y-5">
      {/* Account summary */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="mb-3 text-sm font-black text-slate-900">Account</div>
        <div className="grid gap-3 sm:grid-cols-2">
          {summary.map((s) => (
            <div key={s.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 px-3.5 py-3">
              <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200"><s.icon size={15} /></div>
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-wide text-slate-400">{s.label}</div>
                <div className="truncate text-sm font-bold text-slate-800">{s.value}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editable details */}
      <div className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6">
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
        <button onClick={save} disabled={saving} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-black text-white hover:bg-slate-800 disabled:opacity-60 sm:w-auto">
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />} Save changes
        </button>
      </div>
    </div>
  );
}
