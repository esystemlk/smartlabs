'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import Link from 'next/link';
import {
  Search, ChevronLeft, Loader2, Crown, Plus, RefreshCw, Trash2,
  CheckCircle2, XCircle, Infinity as InfinityIcon, Clock,
} from 'lucide-react';

const CRIMSON = '#dc2626';
const UNLIMITED_ROLES = ['admin', 'developer', 'teacher'];

interface UserCredits {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  ieltsEssayFreeUsed: number;
  ieltsEssayPaidCredits: number;
  ieltsEssayMonthlyExpiry: string | null;
  monthlyActive: boolean;
}
interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info' }

export default function IeltsEssayCreditsAdminPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [emailInput, setEmailInput] = useState('');
  const [searching, setSearching] = useState(false);
  const [target, setTarget] = useState<UserCredits | null>(null);
  const [targetError, setTargetError] = useState('');
  const [scoringAmt, setScoringAmt] = useState('');
  const [monthDays, setMonthDays] = useState('40');
  const [applying, setApplying] = useState(false);

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  useEffect(() => {
    if (isUserLoading || !user || !firestore) return;
    getDoc(doc(firestore, 'users', user.uid)).then(snap => {
      const role = snap.data()?.role ?? '';
      if (['admin', 'developer'].includes(role)) setAllowed(true);
      else router.push('/dashboard');
      setCheckingAuth(false);
    });
  }, [user, isUserLoading, firestore, router]);

  const getToken = async () => (user ? user.getIdToken() : '');

  const handleSearch = async () => {
    if (!emailInput.trim()) return;
    setSearching(true); setTarget(null); setTargetError(''); setScoringAmt('');
    try {
      const token = await getToken();
      const res = await fetch(`/api/admin/manage-ielts-credits?email=${encodeURIComponent(emailInput.trim())}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) { setTargetError(data.error ?? 'User not found.'); return; }
      setTarget(data as UserCredits);
    } catch {
      setTargetError('Network error — please try again.');
    } finally {
      setSearching(false);
    }
  };

  const applyAction = async (
    action: 'add_scoring' | 'set_monthly' | 'reset_free' | 'reset_all',
    extra?: { amount?: number; days?: number }
  ) => {
    if (!target) return;
    setApplying(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/manage-ielts-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUid: target.uid, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Action failed.', 'error'); return; }
      toast(data.description, 'success');
      setTarget(prev => prev ? { ...prev, ...data.credits } : prev);
      setScoringAmt('');
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
          <Loader2 className="h-10 w-10 animate-spin" style={{ color: CRIMSON }} />
          <p className="text-sm font-medium">Verifying access…</p>
        </div>
      </div>
    );
  }
  if (!allowed) return null;

  const isTargetUnlimited = target ? UNLIMITED_ROLES.includes(target.role) : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-3xl mx-auto px-5 py-10">
        <Link href="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-400 hover:text-slate-200 mb-6">
          <ChevronLeft size={16} /> Admin dashboard
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white" style={{ backgroundColor: CRIMSON }}>
            <Crown size={22} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: '#fca5a5' }}>IELTS</p>
            <h1 className="text-2xl font-black">Essay Credits</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400 mb-8">Grant or reset a student&apos;s IELTS essay scoring credits.</p>

        {/* Search */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Student email address"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="px-5 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-50"
            style={{ backgroundColor: CRIMSON }}
          >
            {searching ? <Loader2 size={16} className="animate-spin" /> : 'Look up'}
          </button>
        </div>

        {targetError && (
          <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-400 mb-4">
            <XCircle size={15} /> {targetError}
          </p>
        )}

        {/* Result */}
        {target && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="text-sm font-black">{target.displayName || '(no name)'}</p>
                  <p className="text-xs text-slate-400">{target.email}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-full bg-slate-800 text-slate-300">{target.role}</span>
              </div>

              {isTargetUnlimited ? (
                <p className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-emerald-400">
                  <InfinityIcon size={16} /> Staff role — unlimited scoring, no credits needed.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-xl bg-slate-800/60 p-3">
                    <p className="text-2xl font-black tabular-nums" style={{ color: target.ieltsEssayPaidCredits > 0 ? '#fca5a5' : '#64748b' }}>{target.ieltsEssayPaidCredits}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Paid credits</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-3">
                    <p className="text-2xl font-black tabular-nums text-slate-300">{target.ieltsEssayFreeUsed}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Free used</p>
                  </div>
                  <div className="rounded-xl bg-slate-800/60 p-3">
                    {target.monthlyActive
                      ? <p className="text-sm font-black text-emerald-400 inline-flex items-center gap-1"><CheckCircle2 size={14} /> Active</p>
                      : <p className="text-sm font-black text-slate-500 inline-flex items-center gap-1"><Clock size={14} /> None</p>}
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-0.5">Unlimited plan</p>
                    {target.ieltsEssayMonthlyExpiry && (
                      <p className="text-[10px] text-slate-500 mt-0.5">to {new Date(target.ieltsEssayMonthlyExpiry).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {!isTargetUnlimited && (
              <div className="grid sm:grid-cols-2 gap-5">
                {/* Add scoring credits */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Add scoring credits</p>
                  <div className="flex gap-2">
                    <input
                      type="number" min={1} value={scoringAmt}
                      onChange={e => setScoringAmt(e.target.value)}
                      placeholder="e.g. 40"
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    />
                    <button
                      onClick={() => applyAction('add_scoring', { amount: Number(scoringAmt) })}
                      disabled={applying || !scoringAmt}
                      className="px-4 py-2 rounded-lg text-white font-bold text-sm inline-flex items-center gap-1 disabled:opacity-40"
                      style={{ backgroundColor: CRIMSON }}
                    >
                      <Plus size={15} /> Add
                    </button>
                  </div>
                </div>

                {/* Unlimited plan */}
                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
                  <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Grant unlimited plan</p>
                  <div className="flex gap-2">
                    <input
                      type="number" min={1} value={monthDays}
                      onChange={e => setMonthDays(e.target.value)}
                      className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40"
                    />
                    <span className="inline-flex items-center text-xs text-slate-500">days</span>
                    <button
                      onClick={() => applyAction('set_monthly', { days: Number(monthDays) })}
                      disabled={applying}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm inline-flex items-center gap-1 disabled:opacity-40"
                    >
                      <InfinityIcon size={15} /> Grant
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Resets */}
            {!isTargetUnlimited && (
              <div className="flex flex-wrap gap-3">
                <button onClick={() => applyAction('reset_free')} disabled={applying} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-sm disabled:opacity-40">
                  <RefreshCw size={14} /> Reset free used
                </button>
                <button
                  onClick={() => { if (window.confirm('Reset ALL IELTS essay credits for this user to zero?')) applyAction('reset_all'); }}
                  disabled={applying}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-950 hover:bg-red-900 text-red-300 font-bold text-sm disabled:opacity-40"
                >
                  <Trash2 size={14} /> Reset all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toasts */}
      <div className="fixed bottom-5 right-5 space-y-2 z-50">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg ${
            t.type === 'success' ? 'bg-emerald-600 text-white' : t.type === 'error' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-100'
          }`}>
            {t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
