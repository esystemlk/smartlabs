'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { payhereUrls } from '@/lib/payhere';
import { listQuestions } from '@/lib/services/pte-questions.service';
import type { PteQuestion } from '@/types/pte-question';
import { SWTResultDetails, type SWTResult } from '@/components/swt/SWTResultDetails';
import { useToast } from '@/hooks/use-toast';
import {
  BookOpenText, Sparkles, ArrowRight, ArrowLeft, Lock, CheckCircle2, XCircle,
  Loader2, CreditCard, Infinity as InfinityIcon, X, Zap,
} from 'lucide-react';
import { AiRetryDialog } from '@/components/ui/ai-retry-dialog';

const FREE_SWT_LIMIT = 2;

const SWT_PACKAGES = [
  { id: 'swt_10',        label: '10 Tests',  scoring: 10,  price: 1500,  popular: false },
  { id: 'swt_40',        label: '40 Tests',  scoring: 40,  price: 3500,  popular: true  },
  { id: 'swt_100',       label: '100 Tests', scoring: 100, price: 6000,  popular: false },
  { id: 'swt_unlimited', label: 'Unlimited', scoring: -1,  price: 15000, popular: false },
];

interface CreditInfo { freeUsed: number; paidCredits: number; hasMonthly: boolean; role: string; }

function SWTInner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<PteQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [selected, setSelected] = useState<PteQuestion | null>(null);

  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SWTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryOpen, setRetryOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  const [credit, setCredit] = useState<CreditInfo | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [purchasingPkg, setPurchasingPkg] = useState<string | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const payhereFormRef = useRef<HTMLFormElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Load questions from the admin bank ──
  useEffect(() => {
    setLoadingQ(true);
    listQuestions('writing', 'swt', true)
      .then(qs => setQuestions(qs))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQ(false));
  }, []);

  // ── Load credits ──
  const refreshCredits = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(firestore, 'users', user.uid));
      const d = snap.data() ?? {};
      const expiry = (d.swtMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
      setCredit({
        freeUsed: (d.swtFreeUsed as number) ?? 0,
        paidCredits: (d.swtPaidCredits as number) ?? 0,
        hasMonthly: !!(expiry && expiry > new Date()),
        role: (d.role as string) ?? 'student',
      });
    } catch { /* ignore */ }
  };
  useEffect(() => { if (user) refreshCredits(); /* eslint-disable-next-line */ }, [user]);

  // ── Payment return ──
  useEffect(() => {
    const p = searchParams?.get('payment');
    if (p === 'success') { toast({ title: 'Payment successful!', description: 'SWT credits added to your account.' }); refreshCredits(); }
    else if (p === 'cancelled') { toast({ title: 'Payment cancelled', variant: 'destructive' }); }
    // eslint-disable-next-line
  }, [searchParams]);

  // ── Auto-submit PayHere form ──
  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);

  const unlimited = !!credit && (['admin', 'developer', 'teacher'].includes(credit.role) || credit.hasMonthly);
  const remaining = useMemo(() => {
    if (!credit) return null;
    if (unlimited) return -1;
    if (credit.paidCredits > 0) return credit.paidCredits;
    return Math.max(0, FREE_SWT_LIMIT - credit.freeUsed);
  }, [credit, unlimited]);

  // ── Live Form analysis ──
  const form = useMemo(() => {
    const t = summary.trim();
    const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    const singleSentence = !/[.!?]+\s+\S/.test(t);
    const hasLetters = /[a-z]/i.test(t);
    const allCaps = hasLetters && t === t.toUpperCase();
    const wordsOk = words >= 5 && words <= 75;
    return { words, singleSentence, allCaps, wordsOk };
  }, [summary]);

  const handleSubmit = async () => {
    if (!user) { setShowSignIn(true); return; }
    if (!selected || isSubmitting || !summary.trim()) return;
    setIsSubmitting(true); setError(null); setResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/score-swt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ passage: selected.content, summary }),
      });
      const data = await res.json();
      if (res.status === 402 || data.code === 'NO_CREDITS') { setShowPurchase(true); return; }
      if (!res.ok) throw new Error(data.error || 'Scoring failed.');
      setResult(data as SWTResult);
      refreshCredits();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      console.error('[swt] scoring failed:', e);
      setRetryOpen(true);
    } finally {
      setIsSubmitting(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = async () => {
    setIsRetrying(true);
    setRetryOpen(false);
    await handleSubmit();
  };

  const handlePurchase = async (pkgId: string) => {
    if (!user) { setShowSignIn(true); return; }
    setPurchasingPkg(pkgId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/swt-credits/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ packageId: pkgId }),
      });
      const data = await res.json();
      if (!res.ok || !data.params) { toast({ variant: 'destructive', title: data.error || 'Payment setup failed' }); return; }
      setPayhereParams(data.params);
    } catch {
      toast({ variant: 'destructive', title: 'Network error. Please try again.' });
    } finally {
      setPurchasingPkg(null);
    }
  };

  const backToList = () => { setSelected(null); setSummary(''); setResult(null); setError(null); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <AiRetryDialog
        open={retryOpen}
        onRetry={handleRetry}
        onClose={() => setRetryOpen(false)}
        isRetrying={isRetrying}
      />
      {/* Hidden PayHere form */}
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-3">
            {/* Credits chip */}
            {user && credit && (
              <button onClick={() => setShowPurchase(true)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-700 text-xs font-black">
                {unlimited ? <><InfinityIcon size={13} /> Unlimited</> : <>{remaining} left</>}
                <CreditCard size={13} />
              </button>
            )}
            <span className="hidden sm:flex items-center gap-2 text-sm font-black text-slate-800"><Sparkles size={16} className="text-violet-600" /> SWT Trainer</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <span className="inline-flex items-center gap-2 text-violet-600 font-black text-xs uppercase tracking-[0.3em] mb-2">
            <BookOpenText size={14} /> Summarize Written Text
          </span>
          <h1 className="text-4xl font-black tracking-tight">PTE SWT <span className="text-violet-600">AI Trainer & Examiner</span></h1>
          <p className="text-slate-500 mt-2 max-w-2xl mx-auto font-medium">
            Pick a passage, write <strong>one sentence</strong> (5–75 words) that captures the main ideas, and get a full score breakdown with idea-by-idea coaching.
          </p>
        </div>

        {/* ── QUESTION SELECTION ── */}
        {!selected && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Choose a Passage</h2>
            {loadingQ ? (
              <div className="flex items-center gap-2 text-slate-400 py-12 justify-center"><Loader2 className="animate-spin" size={18} /> Loading passages…</div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                <p className="text-slate-600 font-bold">No passages available yet.</p>
                <p className="text-slate-400 text-sm mt-1">New SWT passages are added by the Smart Labs team — please check back soon.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {questions.map((q, i) => (
                  <button
                    key={q.id ?? i}
                    onClick={() => { setSelected(q); setSummary(''); setResult(null); setError(null); }}
                    className="text-left rounded-3xl border border-slate-200 hover:border-violet-300 hover:shadow-lg transition-all p-5 group bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-violet-600">Passage {i + 1}</span>
                      {q.category && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{q.category}</span>}
                    </div>
                    <h3 className="font-black text-slate-800 mb-1.5 group-hover:text-violet-700 transition-colors">{q.title}</h3>
                    <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">{q.content}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-violet-600 opacity-0 group-hover:opacity-100 transition-opacity">Practise <ArrowRight size={13} /></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRACTICE AREA ── */}
        {selected && (
          <div>
            <button onClick={backToList} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-violet-600 mb-4">
              <ArrowLeft size={15} /> All passages
            </button>

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8 mb-6">
              <span className="text-[11px] font-black uppercase tracking-widest text-violet-600 block mb-2">{selected.title}</span>
              <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{selected.content}</p>
            </div>

            <div className="rounded-3xl border border-slate-200 p-6 md:p-8 mb-6">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Your One-Sentence Summary</label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Write a single, complete sentence summarising the passage…"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-violet-500/30"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold">
                <span className={`inline-flex items-center gap-1 ${form.wordsOk ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {form.wordsOk ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {form.words} / 5–75 words
                </span>
                <span className={`inline-flex items-center gap-1 ${form.singleSentence ? 'text-emerald-600' : 'text-red-500'}`}>
                  {form.singleSentence ? <CheckCircle2 size={14} /> : <XCircle size={14} />} One sentence
                </span>
                {form.allCaps && <span className="inline-flex items-center gap-1 text-red-500"><XCircle size={14} /> Not all caps</span>}
              </div>
              {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}

              <div className="mt-5">
                {isUserLoading ? null : !user ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm text-slate-500 inline-flex items-center gap-2"><Lock size={15} /> Sign in to score your summary.</span>
                    <button onClick={() => setShowSignIn(true)} className="px-6 py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm">Sign In</button>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !summary.trim()}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-violet-500/20"
                  >
                    {isSubmitting ? (<><Loader2 className="animate-spin" size={18} /> Evaluating…</>) : (<>Score My Summary <ArrowRight size={16} /></>)}
                  </button>
                )}
              </div>
            </div>

            {result && (
              <div ref={resultsRef} className="pt-6">
                <div className="text-center mb-8">
                  <span className="text-violet-600 font-black text-xs uppercase tracking-[0.3em]">Evaluation & Coaching</span>
                  <h2 className="text-3xl font-black text-slate-900 mt-1">Your SWT Result</h2>
                </div>
                <SWTResultDetails result={result} />
                <div className="text-center mt-10">
                  <button onClick={backToList} className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm">
                    Practise Another Passage <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Purchase Modal ── */}
      {showPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 py-8 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 w-full max-w-2xl shadow-2xl border border-slate-200 my-auto">
            <div className="flex items-start justify-between mb-1">
              <div>
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><CreditCard size={18} className="text-violet-600" /> Buy SWT Credits</h2>
                <p className="text-slate-500 text-sm mt-1">{remaining === 0 ? "You've used your free SWT scorings. Purchase to keep practising." : 'Top up your SWT scoring credits.'}</p>
              </div>
              <button onClick={() => setShowPurchase(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              {SWT_PACKAGES.map(pkg => {
                const isUnlimited = pkg.scoring === -1;
                const buying = purchasingPkg === pkg.id;
                return (
                  <div key={pkg.id} className={`relative rounded-3xl border-2 p-5 ${pkg.popular ? 'border-violet-400 ring-2 ring-violet-200' : 'border-slate-200'}`}>
                    {pkg.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">Most Popular</span>}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{pkg.label}</span>
                      <span className="text-2xl font-black text-slate-900">{(pkg.price / 1000).toFixed(pkg.price % 1000 === 0 ? 0 : 1)}k <span className="text-xs text-slate-400">LKR</span></span>
                    </div>
                    <p className="text-sm text-slate-600 font-semibold mb-4 flex items-center gap-1.5">
                      {isUnlimited ? <><InfinityIcon size={15} className="text-violet-600" /> Unlimited scorings · 40 days</> : <><Zap size={14} className="text-violet-600" /> {pkg.scoring} essay scorings</>}
                    </p>
                    <button onClick={() => handlePurchase(pkg.id)} disabled={!!purchasingPkg} className="w-full py-2.5 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                      {buying ? <Loader2 className="animate-spin" size={16} /> : <CreditCard size={15} />} Buy — LKR {pkg.price.toLocaleString()}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-center text-xs text-slate-400 mt-4">🔒 Secured by PayHere · LKR · Credits never expire (except unlimited plan)</p>
          </div>
        </div>
      )}

      {/* ── Sign-in Modal ── */}
      {showSignIn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-200 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 border border-violet-200 flex items-center justify-center mx-auto mb-5"><Lock size={30} className="text-violet-600" /></div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Sign In Required</h2>
            <p className="text-slate-500 text-sm mb-6">Create a free SmartLabs account to use the SWT trainer — you get {FREE_SWT_LIMIT} free scorings.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-extrabold px-6 py-3 rounded-xl text-sm text-center" onClick={() => setShowSignIn(false)}>Create Free Account</Link>
              <Link href="/login" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-6 py-3 rounded-xl text-sm text-center" onClick={() => setShowSignIn(false)}>Sign In</Link>
            </div>
            <button onClick={() => setShowSignIn(false)} className="mt-4 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SWTTrainerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>}>
      <SWTInner />
    </Suspense>
  );
}
