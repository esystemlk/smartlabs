'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import Link from 'next/link';
import {
  Search, UserCheck, Target, FileText, Crown, RefreshCw, Plus,
  AlertTriangle, CheckCircle2, XCircle, ChevronLeft, Infinity as InfinityIcon,
  Clock, Loader2, ShieldCheck, History, Trash2, Gift,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────────────────────────────── */
interface UserCredits {
  uid:                string;
  email:              string;
  displayName:        string;
  role:               string;
  essayFreeUsed:      number;
  essayPaidCredits:   number;
  essayGenCredits:    number;
  essayMonthlyExpiry: string | null;
  monthlyActive:      boolean;
}

interface ActionLog {
  id:          string;
  description: string;
  action:      string;
  timestamp:   { seconds: number } | null;
  targetUid:   string;
}

interface Toast { id: number; msg: string; type: 'success' | 'error' | 'info' }

/* ─── Component ─────────────────────────────────────────────────────────────── */
export default function EssayCreditsAdminPage() {
  const { user, isUserLoading } = useUser();
  const { firestore }           = useFirebase();
  const router                  = useRouter();

  /* Access control */
  const [allowed,   setAllowed]   = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  /* Search */
  const [emailInput,  setEmailInput]  = useState('');
  const [searching,   setSearching]   = useState(false);

  /* Found user */
  const [target,      setTarget]      = useState<UserCredits | null>(null);
  const [targetError, setTargetError] = useState('');

  /* Give-credits form */
  const [scoringAmt,  setScoringAmt]  = useState('');
  const [genAmt,      setGenAmt]      = useState('');
  const [monthDays,   setMonthDays]   = useState('30');
  const [applying,    setApplying]    = useState(false);

  /* History */
  const [history,     setHistory]     = useState<ActionLog[]>([]);
  const [histLoading, setHistLoading] = useState(false);

  /* Toasts */
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toast = (msg: string, type: Toast['type'] = 'info') => {
    const id = Date.now();
    setToasts(p => [...p, { id, msg, type }]);
    setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 4000);
  };

  /* ── Auth guard ───────────────────────────────────────────────────────────── */
  useEffect(() => {
    if (isUserLoading || !user || !firestore) return;
    getDoc(doc(firestore, 'users', user.uid)).then(snap => {
      const role = snap.data()?.role ?? '';
      if (['admin', 'developer'].includes(role)) {
        setAllowed(true);
      } else {
        router.push('/dashboard');
      }
      setCheckingAuth(false);
    });
  }, [user, isUserLoading, firestore, router]);

  /* ── Helper: get ID token ─────────────────────────────────────────────────── */
  const getToken = async () => (user ? user.getIdToken() : '');

  /* ── Search user by email ─────────────────────────────────────────────────── */
  const handleSearch = async () => {
    if (!emailInput.trim()) return;
    setSearching(true);
    setTarget(null);
    setTargetError('');
    setScoringAmt('');
    setGenAmt('');
    setHistory([]);

    try {
      const token = await getToken();
      const res = await fetch(
        `/api/admin/manage-credits?email=${encodeURIComponent(emailInput.trim())}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) { setTargetError(data.error ?? 'User not found.'); return; }
      setTarget(data as UserCredits);
      loadHistory(data.uid);
    } catch {
      setTargetError('Network error — please try again.');
    } finally {
      setSearching(false);
    }
  };

  /* ── Load recent admin actions for this user ──────────────────────────────── */
  const loadHistory = async (uid: string) => {
    if (!firestore) return;
    setHistLoading(true);
    try {
      const q = query(
        collection(firestore, 'admin_actions'),
        where('targetUid', '==', uid),
        where('type', '==', 'essay_credits'),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const snap = await getDocs(q);
      setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() } as ActionLog)));
    } catch { /* silent */ }
    finally { setHistLoading(false); }
  };

  /* ── Call the manage-credits API ──────────────────────────────────────────── */
  const applyAction = async (
    action: 'add_scoring' | 'add_gen' | 'set_monthly' | 'reset_free' | 'reset_all',
    extra?: { amount?: number; days?: number }
  ) => {
    if (!target) return;
    setApplying(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/manage-credits', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ targetUid: target.uid, action, ...extra }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Action failed.', 'error'); return; }
      toast(data.description, 'success');
      // Update local state with fresh credits
      setTarget(prev => prev ? { ...prev, ...data.credits } : prev);
      setScoringAmt('');
      setGenAmt('');
      loadHistory(target.uid);
    } catch {
      toast('Network error — please try again.', 'error');
    } finally {
      setApplying(false);
    }
  };

  /* ── Loading / access-denied screens ─────────────────────────────────────── */
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

  /* ── Main render ──────────────────────────────────────────────────────────── */
  const UNLIMITED_ROLES = ['admin', 'developer', 'teacher'];
  const isTargetUnlimited = target ? UNLIMITED_ROLES.includes(target.role) : false;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      {/* ── Toasts ── */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <div key={t.id} className={`pointer-events-auto flex items-center gap-3 px-5 py-3.5 rounded-2xl border shadow-xl text-sm font-semibold min-w-[260px] max-w-sm ${
            t.type === 'success' ? 'bg-emerald-900 border-emerald-700 text-emerald-200'
            : t.type === 'error' ? 'bg-red-900 border-red-700 text-red-200'
            : 'bg-slate-800 border-slate-700 text-slate-200'
          }`}>
            {t.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />}
            {t.type === 'error'   && <XCircle      size={16} className="text-red-400    shrink-0" />}
            {t.type === 'info'    && <ShieldCheck  size={16} className="text-blue-400   shrink-0" />}
            <span className="flex-1">{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/dashboard"
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-slate-400">
              <ChevronLeft size={18} />
            </Link>
            <div>
              <h1 className="text-base font-bold text-white flex items-center gap-2">
                <Gift size={18} className="text-orange-400" />
                Essay Credit Manager
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">Admin &amp; Developer only</p>
            </div>
          </div>
          <Link href="/admin/dashboard"
            className="text-xs font-semibold text-slate-400 hover:text-white transition-colors">
            ← Admin Dashboard
          </Link>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* ── SEARCH BOX ── */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
            <Search size={15} /> Search Student
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              placeholder="Enter student email address…"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
            />
            <button
              onClick={handleSearch}
              disabled={searching || !emailInput.trim()}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-extrabold text-sm px-6 py-3 rounded-xl transition-all active:scale-95"
            >
              {searching
                ? <Loader2 size={16} className="animate-spin" />
                : <Search size={16} />}
              {searching ? 'Searching…' : 'Find'}
            </button>
          </div>
          {targetError && (
            <p className="mt-3 flex items-center gap-2 text-sm text-red-400 font-semibold">
              <AlertTriangle size={14} /> {targetError}
            </p>
          )}
        </section>

        {/* ── USER CREDIT STATUS PANEL ── */}
        {target && (
          <>
            <section className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              {/* User header */}
              <div className="px-6 py-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg font-black text-orange-400">
                    {(target.displayName || target.email).charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-bold text-white text-base">{target.displayName || '—'}</p>
                    <p className="text-sm text-slate-400">{target.email}</p>
                    <span className={`inline-block mt-1 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      target.role === 'admin'     ? 'bg-red-900/50 border-red-700 text-red-300'
                      : target.role === 'developer' ? 'bg-violet-900/50 border-violet-700 text-violet-300'
                      : target.role === 'teacher'   ? 'bg-blue-900/50 border-blue-700 text-blue-300'
                      : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {target.role}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleSearch()}
                  disabled={searching}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-white border border-slate-700 hover:border-slate-500 px-3 py-2 rounded-xl transition-colors"
                >
                  <RefreshCw size={13} className={searching ? 'animate-spin' : ''} />
                  Refresh
                </button>
              </div>

              {/* Credit tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-800">
                {/* Free used */}
                <div className="bg-slate-900 px-5 py-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Free Used</p>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-3xl font-black tabular-nums ${target.essayFreeUsed >= 2 ? 'text-red-400' : 'text-slate-300'}`}>
                      {target.essayFreeUsed}
                    </span>
                    <span className="text-slate-600 text-sm">/ 2</span>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">free scoring slots</p>
                </div>

                {/* Paid scoring */}
                <div className="bg-slate-900 px-5 py-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                    <Target size={11} /> Scoring Credits
                  </p>
                  {isTargetUnlimited ? (
                    <div className="flex items-center gap-1.5">
                      <InfinityIcon size={24} className="text-violet-400" />
                      <span className="text-sm font-black text-violet-300">Unlimited</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black tabular-nums ${target.essayPaidCredits > 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                        {target.essayPaidCredits}
                      </span>
                      <span className="text-slate-600 text-sm">credits</span>
                    </div>
                  )}
                </div>

                {/* Gen credits */}
                <div className="bg-slate-900 px-5 py-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                    <FileText size={11} /> Gen Credits
                  </p>
                  {isTargetUnlimited ? (
                    <div className="flex items-center gap-1.5">
                      <InfinityIcon size={24} className="text-violet-400" />
                      <span className="text-sm font-black text-violet-300">Unlimited</span>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-1">
                      <span className={`text-3xl font-black tabular-nums ${target.essayGenCredits > 0 ? 'text-blue-400' : 'text-slate-600'}`}>
                        {target.essayGenCredits}
                      </span>
                      <span className="text-slate-600 text-sm">gens</span>
                    </div>
                  )}
                </div>

                {/* Monthly plan */}
                <div className="bg-slate-900 px-5 py-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1">
                    <Crown size={11} /> Monthly Plan
                  </p>
                  {target.monthlyActive ? (
                    <>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                        <span className="text-sm font-black text-emerald-300">Active</span>
                      </div>
                      {target.essayMonthlyExpiry && (
                        <p className="text-[10px] text-slate-500 flex items-center gap-1">
                          <Clock size={10} />
                          Expires {new Date(target.essayMonthlyExpiry).toLocaleDateString()}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <XCircle size={16} className="text-slate-600" />
                      <span className="text-sm font-semibold text-slate-500">Inactive</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* ── GIVE CREDITS PANEL ── */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Plus size={15} /> Give Credits
              </h2>

              <div className="grid sm:grid-cols-2 gap-4">

                {/* Add Scoring Credits */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-900/50 border border-emerald-800 flex items-center justify-center">
                      <Target size={15} className="text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Add Scoring Credits</p>
                      <p className="text-[11px] text-slate-500">Essay scoring attempts</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      placeholder="Amount (e.g. 10)"
                      value={scoringAmt}
                      onChange={e => setScoringAmt(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      onClick={() => applyAction('add_scoring', { amount: parseInt(scoringAmt) })}
                      disabled={applying || !scoringAmt || parseInt(scoringAmt) < 1}
                      className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 rounded-xl transition-all active:scale-95"
                    >
                      {applying ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Add
                    </button>
                  </div>
                  {/* Quick amounts */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[5, 10, 20, 30, 50, 100].map(n => (
                      <button key={n}
                        onClick={() => { setScoringAmt(String(n)); }}
                        className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-emerald-900/60 border border-slate-600 hover:border-emerald-700 text-slate-400 hover:text-emerald-300 transition-colors"
                      >+{n}</button>
                    ))}
                  </div>
                </div>

                {/* Add Gen Credits */}
                <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-900/50 border border-blue-800 flex items-center justify-center">
                      <FileText size={15} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Add Generation Credits</p>
                      <p className="text-[11px] text-slate-500">Model essay generations</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="1"
                      max="500"
                      placeholder="Amount (e.g. 5)"
                      value={genAmt}
                      onChange={e => setGenAmt(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={() => applyAction('add_gen', { amount: parseInt(genAmt) })}
                      disabled={applying || !genAmt || parseInt(genAmt) < 1}
                      className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 rounded-xl transition-all active:scale-95"
                    >
                      {applying ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Add
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {[3, 5, 8, 10, 25, 50].map(n => (
                      <button key={n}
                        onClick={() => setGenAmt(String(n))}
                        className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-blue-900/60 border border-slate-600 hover:border-blue-700 text-slate-400 hover:text-blue-300 transition-colors"
                      >+{n}</button>
                    ))}
                  </div>
                </div>

                {/* Unlimited Monthly Plan */}
                <div className="bg-slate-800/60 border border-amber-900/40 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-900/50 border border-amber-800 flex items-center justify-center">
                      <Crown size={15} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Grant Unlimited Plan</p>
                      <p className="text-[11px] text-slate-500">Unlimited scoring for N days</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="number"
                        min="1"
                        max="365"
                        value={monthDays}
                        onChange={e => setMonthDays(e.target.value)}
                        className="w-24 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <span className="text-sm text-slate-500 font-semibold">days</span>
                    </div>
                    <button
                      onClick={() => applyAction('set_monthly', { days: parseInt(monthDays) })}
                      disabled={applying || !monthDays || parseInt(monthDays) < 1}
                      className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-extrabold text-xs px-4 rounded-xl transition-all active:scale-95"
                    >
                      {applying ? <Loader2 size={13} className="animate-spin" /> : <Crown size={13} />}
                      Grant
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    {[7, 14, 30, 60, 90].map(n => (
                      <button key={n}
                        onClick={() => setMonthDays(String(n))}
                        className="text-[11px] font-black px-2.5 py-1 rounded-lg bg-slate-700 hover:bg-amber-900/60 border border-slate-600 hover:border-amber-700 text-slate-400 hover:text-amber-300 transition-colors"
                      >{n}d</button>
                    ))}
                  </div>
                </div>

                {/* Reset / Danger zone */}
                <div className="bg-slate-800/60 border border-red-900/40 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-red-900/50 border border-red-800 flex items-center justify-center">
                      <AlertTriangle size={15} className="text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">Danger Zone</p>
                      <p className="text-[11px] text-slate-500">Irreversible reset actions</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        if (confirm(`Reset free-used counter for ${target.email}? They will get 2 free scorings again.`))
                          applyAction('reset_free');
                      }}
                      disabled={applying}
                      className="w-full flex items-center gap-2 bg-slate-700 hover:bg-orange-900/50 border border-slate-600 hover:border-orange-700 disabled:opacity-40 text-slate-300 hover:text-orange-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                    >
                      <RefreshCw size={13} /> Reset Free Counter (give 2 free back)
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`⚠️ RESET ALL CREDITS for ${target.email}? This will zero out scoring, gen credits and monthly plan.`))
                          applyAction('reset_all');
                      }}
                      disabled={applying}
                      className="w-full flex items-center gap-2 bg-slate-700 hover:bg-red-900/50 border border-slate-600 hover:border-red-700 disabled:opacity-40 text-slate-300 hover:text-red-300 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                    >
                      <Trash2 size={13} /> Reset ALL Essay Credits
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* ── ACTION HISTORY ── */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
              <h2 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <History size={15} /> Recent Actions on This User
              </h2>
              {histLoading ? (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 size={14} className="animate-spin" /> Loading history…
                </div>
              ) : history.length === 0 ? (
                <p className="text-sm text-slate-600 italic">No admin actions recorded yet for this user.</p>
              ) : (
                <div className="space-y-2">
                  {history.map(log => (
                    <div key={log.id} className="flex items-start gap-3 bg-slate-800/60 border border-slate-700 px-4 py-3 rounded-xl">
                      <UserCheck size={15} className="text-slate-500 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-300 truncate">{log.description}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          Action: <span className="text-slate-500 font-mono">{log.action}</span>
                          {log.timestamp && (
                            <> · {new Date(log.timestamp.seconds * 1000).toLocaleString()}</>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {/* ── Empty state (no search yet) ── */}
        {!target && !targetError && !searching && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center">
              <Search size={28} className="text-slate-600" />
            </div>
            <p className="text-slate-500 font-semibold text-sm max-w-xs">
              Enter a student's email address above to view and manage their essay credits.
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
