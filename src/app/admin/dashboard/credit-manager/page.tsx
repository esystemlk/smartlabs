'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import {
  Search, RefreshCw, Plus, Minus, Crown, AlertTriangle, CheckCircle2, XCircle,
  ChevronLeft, Loader2, ShieldCheck, Gift, Users, Coins, Trash2,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface PoolInfo { paid: number; gen?: number; monthlyActive: boolean; monthlyExpiry: string | null }
interface Holder {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  pools: {
    essay: PoolInfo; swt: PoolInfo; sst: PoolInfo; speaking: PoolInfo; ieltsEssay: PoolInfo; universal: PoolInfo;
  };
  totalPaid: number;
  anyMonthly: boolean;
}
interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info' }

const POOL_LABELS: { key: keyof Holder['pools']; label: string }[] = [
  { key: 'universal', label: 'Universal' },
  { key: 'essay', label: 'Essay' },
  { key: 'swt', label: 'SWT' },
  { key: 'sst', label: 'SST' },
  { key: 'speaking', label: 'Speaking' },
  { key: 'ieltsEssay', label: 'IELTS' },
];

export default function CreditManagerPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [holders, setHolders] = useState<Holder[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState('');
  const [filter, setFilter] = useState('');

  const [selected, setSelected] = useState<Holder | null>(null);
  const [giftAmt, setGiftAmt] = useState('');
  const [deductAmt, setDeductAmt] = useState('');
  const [planDays, setPlanDays] = useState('40');
  const [applying, setApplying] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const getToken = useCallback(async () => (user ? user.getIdToken() : ''), [user]);

  /* Auth guard */
  useEffect(() => {
    if (isUserLoading || !user || !firestore) return;
    getDoc(doc(firestore, 'users', user.uid)).then((snap) => {
      const role = snap.data()?.role ?? '';
      if (['admin', 'developer'].includes(role)) setAllowed(true);
      else router.push('/dashboard');
      setCheckingAuth(false);
    });
  }, [user, isUserLoading, firestore, router]);

  const loadHolders = useCallback(async () => {
    setLoadingList(true);
    setListError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/credit-holders', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) { setListError(data.error ?? 'Failed to load.'); return; }
      setHolders(data.holders as Holder[]);
    } catch {
      setListError('Network error — please try again.');
    } finally {
      setLoadingList(false);
    }
  }, [getToken]);

  useEffect(() => { if (allowed) loadHolders(); }, [allowed, loadHolders]);

  const manageUniversal = async (
    action: 'gift' | 'deduct' | 'grant_plan' | 'clear_plan' | 'reset',
    extra?: { amount?: number; days?: number },
  ) => {
    if (!selected) return;
    setApplying(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/manage-universal-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUid: selected.uid, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Action failed.', 'error'); return; }
      toast(data.description, 'success');
      setGiftAmt(''); setDeductAmt('');
      // reflect the new universal balance locally, then refresh the list
      setSelected((prev) => prev ? {
        ...prev,
        pools: { ...prev.pools, universal: { paid: data.universalPaidCredits, monthlyActive: data.universalMonthlyActive, monthlyExpiry: data.universalMonthlyExpiry } },
      } : prev);
      loadHolders();
    } catch {
      toast('Network error — please try again.', 'error');
    } finally {
      setApplying(false);
    }
  };

  if (isUserLoading || checkingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          <p className="text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }
  if (!allowed) return null;

  const q = filter.trim().toLowerCase();
  const shown = q
    ? holders.filter((h) => h.email.toLowerCase().includes(q) || h.displayName.toLowerCase().includes(q))
    : holders;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* Toasts */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl text-sm font-semibold min-w-[260px] max-w-sm ${
            t.type === 'success' ? 'bg-emerald-900 border-emerald-700 text-emerald-200'
            : t.type === 'error' ? 'bg-red-900 border-red-700 text-red-200'
            : 'bg-slate-800 border-slate-700 text-slate-200'}`}>
            {t.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {t.type === 'error' && <XCircle size={16} className="text-red-400 shrink-0" />}
            {t.type === 'info' && <ShieldCheck size={16} className="text-blue-400 shrink-0" />}
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard" className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-slate-400">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Coins size={18} className="text-orange-400" />
                Credit Manager
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Students who hold credits · universal credit control · Admin &amp; Developer only</p>
            </div>
          </div>
          <button onClick={loadHolders} disabled={loadingList}
            className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-colors">
            <RefreshCw size={13} className={loadingList ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Summary + filter */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-900/40 border border-orange-800 flex items-center justify-center">
                <Users size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-black text-white tabular-nums">{holders.length}</p>
                <p className="text-xs text-slate-500 font-semibold">students currently hold credits</p>
              </div>
            </div>
            <div className="relative w-full sm:w-80">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                placeholder="Filter by name or email…"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>
          </div>
          {listError && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-400 font-semibold">
              <AlertTriangle size={14} /> {listError}
            </p>
          )}
        </section>

        {/* Holders table */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          {loadingList ? (
            <div className="flex items-center gap-2 text-slate-500 text-sm p-6">
              <Loader2 size={14} className="animate-spin" /> Loading credit holders…
            </div>
          ) : shown.length === 0 ? (
            <p className="text-sm text-slate-600 italic p-6">
              {holders.length === 0 ? 'No students hold credits yet.' : 'No holders match your filter.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-slate-500 border-b border-slate-800">
                    <th className="text-left font-black px-4 py-3">Student</th>
                    {POOL_LABELS.map((p) => <th key={p.key} className="text-center font-black px-3 py-3">{p.label}</th>)}
                    <th className="text-center font-black px-3 py-3">Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((h) => (
                    <tr key={h.uid} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-white truncate max-w-[220px]">{h.displayName || '—'}</p>
                        <p className="text-xs text-slate-500 truncate max-w-[220px]">{h.email}</p>
                        {['admin', 'developer', 'teacher'].includes(h.role) && (
                          <span className="text-[9px] font-black uppercase text-violet-300">{h.role}</span>
                        )}
                      </td>
                      {POOL_LABELS.map((p) => {
                        const info = h.pools[p.key];
                        return (
                          <td key={p.key} className="text-center px-3 py-3">
                            {info.monthlyActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300"><Crown size={11} /> Plan</span>
                            ) : info.paid > 0 || (p.key === 'essay' && (info.gen ?? 0) > 0) ? (
                              <span className="font-black tabular-nums text-emerald-400">
                                {info.paid}{p.key === 'essay' && (info.gen ?? 0) > 0 ? <span className="text-blue-400 text-[11px]"> +{info.gen}g</span> : null}
                              </span>
                            ) : (
                              <span className="text-slate-700">–</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="text-center px-3 py-3">
                        <button
                          onClick={() => { setSelected(h); setGiftAmt(''); setDeductAmt(''); }}
                          className="text-[11px] font-black px-3 py-1.5 rounded-lg bg-orange-900/40 border border-orange-800 text-orange-300 hover:bg-orange-800/50 transition-colors"
                        >Universal</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Universal management panel */}
        {selected && (
          <section className="bg-slate-900 border border-orange-900/40 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-300 flex items-center gap-2">
                <Gift size={15} className="text-orange-400" /> Universal Credits — {selected.displayName || selected.email}
              </h2>
              <button onClick={() => setSelected(null)} className="text-xs font-bold text-slate-500 hover:text-white">Close</button>
            </div>

            <div className="flex items-center gap-4 bg-slate-800/60 border border-slate-700 rounded-xl px-5 py-4">
              <Coins size={20} className="text-orange-400" />
              <div>
                <p className="text-2xl font-black text-white tabular-nums">{selected.pools.universal.paid}</p>
                <p className="text-[11px] text-slate-500 font-semibold">universal credits available</p>
              </div>
              {selected.pools.universal.monthlyActive && (
                <div className="ml-auto text-right">
                  <span className="inline-flex items-center gap-1 text-xs font-black text-amber-300"><Crown size={12} /> Unlimited plan</span>
                  {selected.pools.universal.monthlyExpiry && (
                    <p className="text-[10px] text-slate-500">until {new Date(selected.pools.universal.monthlyExpiry).toLocaleDateString()}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Gift */}
              <div className="bg-slate-800/60 border border-emerald-900/40 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-800 flex items-center justify-center"><Plus size={15} className="text-emerald-400" /></div>
                  <p className="text-sm font-black text-white">Gift Credits</p>
                </div>
                <div className="flex gap-2">
                  <input type="number" min="1" max="1000" placeholder="Amount" value={giftAmt} onChange={(e) => setGiftAmt(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500" />
                  <button onClick={() => manageUniversal('gift', { amount: parseInt(giftAmt) })} disabled={applying || !giftAmt || parseInt(giftAmt) < 1}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 rounded-xl transition-all active:scale-95">
                    {applying ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />} Gift
                  </button>
                </div>
                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {[10, 40, 100].map((n) => (
                    <button key={n} onClick={() => setGiftAmt(String(n))} className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-emerald-900/60 border border-slate-600 hover:border-emerald-700 text-slate-400 hover:text-emerald-300 transition-colors">+{n}</button>
                  ))}
                </div>
              </div>

              {/* Deduct */}
              <div className="bg-slate-800/60 border border-red-900/40 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-900/50 border border-red-800 flex items-center justify-center"><Minus size={15} className="text-red-400" /></div>
                  <p className="text-sm font-black text-white">Deduct Credits</p>
                </div>
                <div className="flex gap-2">
                  <input type="number" min="1" max="1000" placeholder="Amount" value={deductAmt} onChange={(e) => setDeductAmt(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500" />
                  <button onClick={() => { if (confirm(`Deduct ${deductAmt} universal credits from ${selected.email}?`)) manageUniversal('deduct', { amount: parseInt(deductAmt) }); }} disabled={applying || !deductAmt || parseInt(deductAmt) < 1}
                    className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 rounded-xl transition-all active:scale-95">
                    {applying ? <Loader2 size={13} className="animate-spin" /> : <Minus size={13} />} Deduct
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-2">Never goes below 0. Use to remove wrongly-added credits.</p>
              </div>

              {/* Grant plan */}
              <div className="bg-slate-800/60 border border-amber-900/40 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-800 flex items-center justify-center"><Crown size={15} className="text-amber-400" /></div>
                  <p className="text-sm font-black text-white">Grant Unlimited Plan</p>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <input type="number" min="1" max="365" value={planDays} onChange={(e) => setPlanDays(e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500" />
                    <span className="text-sm text-slate-500 font-semibold">days</span>
                  </div>
                  <button onClick={() => manageUniversal('grant_plan', { days: parseInt(planDays) })} disabled={applying || !planDays || parseInt(planDays) < 1}
                    className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 rounded-xl transition-all active:scale-95">
                    {applying ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />} Grant
                  </button>
                </div>
              </div>

              {/* Danger */}
              <div className="bg-slate-800/60 border border-red-900/40 rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-red-900/50 border border-red-800 flex items-center justify-center"><AlertTriangle size={15} className="text-red-400" /></div>
                  <p className="text-sm font-black text-white">Danger Zone</p>
                </div>
                <div className="space-y-2">
                  <button onClick={() => { if (confirm(`Remove the universal unlimited plan for ${selected.email}?`)) manageUniversal('clear_plan'); }} disabled={applying}
                    className="w-full flex items-center gap-2 bg-slate-700 hover:bg-amber-900/50 border border-slate-600 hover:border-amber-700 disabled:opacity-40 text-slate-300 hover:text-amber-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
                    <XCircle size={13} /> Remove Unlimited Plan
                  </button>
                  <button onClick={() => { if (confirm(`⚠️ RESET all universal credits AND plan for ${selected.email}?`)) manageUniversal('reset'); }} disabled={applying}
                    className="w-full flex items-center gap-2 bg-slate-700 hover:bg-red-900/50 border border-slate-600 hover:border-red-700 disabled:opacity-40 text-slate-300 hover:text-red-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all">
                    <Trash2 size={13} /> Reset Universal Credits
                  </button>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              Per-part credits (Essay, SWT, SST, Speaking, IELTS) are managed on their own pages. Every change here is recorded in the admin audit log.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
