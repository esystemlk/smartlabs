'use client';
import {PtePracticeHero,PtePracticeTopbar,PteQuestionLibrary,PtePracticeSession} from '@/components/pte/practice-design';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CreditsPill } from '@/components/pte/credits-pill';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { payhereUrls } from '@/lib/payhere';
import { listQuestions } from '@/lib/services/pte-questions.service';
import type { PteQuestion } from '@/types/pte-question';
import { SSTResultDetails, type SSTResult } from '@/components/sst/SSTResultDetails';
import { useToast } from '@/hooks/use-toast';
import { AiRetryDialog } from '@/components/ui/ai-retry-dialog';
import {
  Headphones, Sparkles, ArrowRight, ArrowLeft, Lock, CheckCircle2, XCircle,
  Loader2, CreditCard, Infinity as InfinityIcon, X, Zap, Target, ListChecks,
  BarChart3, Timer as TimerIcon, Home, LayoutDashboard, Menu, Crown, Play, Pause,
  Volume2, SignpostBig,
} from 'lucide-react';

const FREE_SST_LIMIT = 2;
const WRITE_SECONDS = 600; // 10 minutes

const SST_PACKAGES = [
  { id: 'sst_10',        label: '10 Tests',  scoring: 10,  price: 1500,  popular: false },
  { id: 'sst_40',        label: '40 Tests',  scoring: 40,  price: 3500,  popular: true  },
  { id: 'sst_100',       label: '100 Tests', scoring: 100, price: 6000,  popular: false },
  { id: 'sst_unlimited', label: 'Unlimited', scoring: -1,  price: 15000, popular: false },
];

interface CreditInfo { freeUsed: number; paidCredits: number; hasMonthly: boolean; role: string; }

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

function SSTInner() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<PteQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [selected, setSelected] = useState<PteQuestion | null>(null);

  useEffect(() => {
    setLoadingQ(true);
    listQuestions('listening', 'summarize-spoken-text', true)
      .then(qs => setQuestions(qs))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQ(false));
  }, []);

  const [summary, setSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SSTResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryOpen, setRetryOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [revealTranscript, setRevealTranscript] = useState(false);

  const [credit, setCredit] = useState<CreditInfo | null>(null);
  const [showPurchase, setShowPurchase] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [purchasingPkg, setPurchasingPkg] = useState<string | null>(null);
  const [payhereParams, setPayhereParams] = useState<Record<string, string> | null>(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const payhereFormRef = useRef<HTMLFormElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // ── Timer ──
  const [timeLeft, setTimeLeft] = useState(WRITE_SECONDS);
  const [timerRunning, setTimerRunning] = useState(false);
  useEffect(() => {
    if (!timerRunning) return;
    if (timeLeft <= 0) { setTimerRunning(false); return; }
    const t = setTimeout(() => setTimeLeft(v => v - 1), 1000);
    return () => clearTimeout(t);
  }, [timerRunning, timeLeft]);

  // ── Audio (real file OR TTS fallback) ──
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // ── Load credits ──
  const refreshCredits = async () => {
    if (!user) return;
    try {
      const snap = await getDoc(doc(firestore, 'users', user.uid));
      const d = snap.data() ?? {};
      const expiry = (d.sstMonthlyExpiry as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
      setCredit({
        freeUsed: (d.sstFreeUsed as number) ?? 0,
        paidCredits: (d.sstPaidCredits as number) ?? 0,
        hasMonthly: !!(expiry && expiry > new Date()),
        role: (d.role as string) ?? 'student',
      });
    } catch { /* ignore */ }
  };
  useEffect(() => { if (user) refreshCredits(); /* eslint-disable-next-line */ }, [user]);

  // ── Payment return ──
  useEffect(() => {
    const p = searchParams?.get('payment');
    if (p === 'success') { toast({ title: 'Payment successful!', description: 'SST credits added to your account.' }); refreshCredits(); }
    else if (p === 'cancelled') { toast({ title: 'Payment cancelled', variant: 'destructive' }); }
    // eslint-disable-next-line
  }, [searchParams]);

  useEffect(() => { if (payhereParams && payhereFormRef.current) payhereFormRef.current.submit(); }, [payhereParams]);

  const isUnlimitedRole = !!credit && ['admin', 'developer', 'teacher'].includes(credit.role);
  const unlimited = !!credit && (isUnlimitedRole || credit.hasMonthly);
  const creditsRemaining = useMemo(() => {
    if (!credit) return 0;
    if (credit.paidCredits > 0) return credit.paidCredits;
    // New accounts no longer get free scoring — only users already on the free
    // tier (freeUsed >= 1) keep their remaining free scorings.
    const freeLimit = credit.freeUsed >= 1 ? FREE_SST_LIMIT : 0;
    return Math.max(0, freeLimit - credit.freeUsed);
  }, [credit]);

  // ── Live Form analysis — official SST rule: 50–70 words = 2 marks, else 0.
  //    All-or-nothing, so there is no "close enough" band to show. ──
  const form = useMemo(() => {
    const t = summary.trim();
    const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    return { words, ideal: words >= 50 && words <= 70 };
  }, [summary]);

  // ── Audio controls ──
  const prepareAudio = async (): Promise<string | null> => {
    if (!selected) return null;
    // Real MP3 provided → use it directly.
    if (selected.audioUrl && selected.audioUrl.trim().length > 0) {
      setAudioSrc(selected.audioUrl);
      return selected.audioUrl;
    }
    // Fallback: synthesize the transcript with TTS (requires sign-in).
    if (audioSrc) return audioSrc;
    if (!user) { setShowSignIn(true); return null; }
    setAudioLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: selected.content }),
      });
      const data = await res.json();
      if (!res.ok || !data.audio) { toast({ variant: 'destructive', title: data.error || 'Could not load audio.' }); return null; }
      const src = `data:audio/mp3;base64,${data.audio}`;
      setAudioSrc(src);
      return src;
    } catch {
      toast({ variant: 'destructive', title: 'Audio failed to load. Please try again.' });
      return null;
    } finally {
      setAudioLoading(false);
    }
  };

  const togglePlay = async () => {
    let src = audioSrc;
    if (!src) src = await prepareAudio();
    if (!src) return;
    const el = audioRef.current;
    if (!el) return;
    if (isPlaying) { el.pause(); return; }
    // Start the write timer when the student first hears the lecture.
    if (!timerRunning && timeLeft === WRITE_SECONDS) setTimerRunning(true);
    try { await el.play(); } catch { /* autoplay blocked; user can retry */ }
  };

  const handleSubmit = async () => {
    if (!user) { setShowSignIn(true); return; }
    if (!selected || isSubmitting || !summary.trim()) return;
    setIsSubmitting(true); setError(null); setResult(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/score-sst', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ transcript: selected.content, summary }),
      });
      const data = await res.json();
      if (res.status === 402 || data.code === 'NO_CREDITS') { window.location.assign('/credits'); return; }
      if (!res.ok) throw new Error(data.error || 'Scoring failed.');
      setResult(data as SSTResult);
      setTimerRunning(false);
      setRevealTranscript(true);
      refreshCredits();
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      console.error('[sst] scoring failed:', e);
      setRetryOpen(true);
    } finally {
      setIsSubmitting(false);
      setIsRetrying(false);
    }
  };

  const handleRetry = async () => { setIsRetrying(true); setRetryOpen(false); await handleSubmit(); };

  const handlePurchase = async (pkgId: string) => {
    if (!user) { setShowSignIn(true); return; }
    setPurchasingPkg(pkgId);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/sst-credits/create-payment', {
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

  const selectQuestion = (q: PteQuestion) => {
    setSelected(q); setSummary(''); setResult(null); setError(null);
    setAudioSrc(null); setIsPlaying(false); setRevealTranscript(false);
    setTimeLeft(WRITE_SECONDS); setTimerRunning(false);
  };

  const backToList = () => {
    setSelected(null); setSummary(''); setResult(null); setError(null);
    setAudioSrc(null); setIsPlaying(false); setRevealTranscript(false);
    setTimeLeft(WRITE_SECONDS); setTimerRunning(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const stats = [
    { value: String(questions.length), label: 'Predicted Lectures', icon: <ListChecks size={22} className="text-emerald-600" /> },
    { value: '90', label: 'Target Band', icon: <Target size={22} className="text-emerald-600" /> },
    { value: '5', label: 'Marking Criteria', icon: <BarChart3 size={22} className="text-emerald-600" /> },
    { value: '10 Min', label: 'Practice Timer', icon: <TimerIcon size={22} className="text-emerald-600" /> },
  ];

  return (
    <div className="pte-practice-studio font-sora" data-practice="sst">
      <AiRetryDialog open={retryOpen} onRetry={handleRetry} onClose={() => setRetryOpen(false)} isRetrying={isRetrying} />

      {/* Hidden PayHere form */}
      <form ref={payhereFormRef} method="post" action={payhereUrls.checkout} className="hidden">
        {payhereParams && Object.entries(payhereParams).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
      </form>

      {/* Audio element */}
      <audio
        ref={audioRef}
        src={audioSrc ?? undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <PtePracticeTopbar kind="sst" signedIn={!!user} credits={user?<CreditsPill pool="sst"/>:undefined}/>
      {!selected&&<PtePracticeHero kind="sst"/>}
      <div className="pte-practice-content" data-session={!!selected}>
        {selected&&<PtePracticeSession kind="sst" questionTitle={selected.title} hasResult={!!result}/>}

        {!selected&&<PteQuestionLibrary kind="sst" questions={questions} loading={loadingQ}  onSelect={index=>selectQuestion(questions[index])}/>}

        {/* ── PRACTICE AREA ── */}
        {selected && (
          <div className="pt-6">
            <button onClick={backToList} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-emerald-600 mb-4">
              <ArrowLeft size={15} /> All lectures
            </button>

            {/* Audio player */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-emerald-600 block">{selected.title}</span>
                <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1 rounded-full ${timeLeft <= 60 ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  <TimerIcon size={13} /> {fmtTime(timeLeft)}
                </span>
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-white border border-slate-200 p-4">
                <button aria-label={isPlaying?'Pause lecture audio':'Play lecture audio'} onClick={togglePlay} disabled={audioLoading} className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 disabled:opacity-60 shadow-lg shadow-emerald-500/20">
                  {audioLoading ? <Loader2 className="animate-spin" size={22} /> : isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800">Listen to the lecture</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selected.audioUrl && selected.audioUrl.trim().length > 0
                      ? 'Play the audio, then write your summary below. You can replay it.'
                      : 'AI voice will read the lecture aloud. Play it, then write your summary below.'}
                  </p>
                </div>
                <Headphones size={22} className="text-slate-300 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5"><Lock size={12} /> The transcript stays hidden until after you submit — just like the real exam.</p>
            </div>

            {/* Summary input */}
            <div className="rounded-3xl border border-slate-200 p-6 md:p-8 mb-6">
              <label htmlFor="pte-response" data-response-label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Your Summary (50–70 words)</label>
              <textarea
                id="pte-response"
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Summarise the lecture in 50–70 words, capturing the main topic and essential keywords…"
                rows={6}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold">
                <span className={`inline-flex items-center gap-1 ${form.ideal ? 'text-emerald-600' : 'text-red-500'}`}>
                  {form.ideal ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {form.words} / 50–70 words
                </span>
                {!form.ideal && form.words > 0 && (
                  <span className="text-red-500">Outside 50–70 scores 0 for Form — no partial marks.</span>
                )}
              </div>
              {error && <p className="text-sm text-red-600 font-medium mt-3">{error}</p>}

              <div className="mt-5">
                {isUserLoading ? null : !user ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm text-slate-500 inline-flex items-center gap-2"><Lock size={15} /> Sign in to score your summary.</span>
                    <button onClick={() => setShowSignIn(true)} className="px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm">Sign In</button>
                  </div>
                ) : (
                  <button onClick={handleSubmit} disabled={isSubmitting || !summary.trim()} className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-emerald-500/20">
                    {isSubmitting ? (<><Loader2 className="animate-spin" size={18} /> Evaluating…</>) : (<>Score My Summary <ArrowRight size={16} /></>)}
                  </button>
                )}
              </div>
            </div>

            {/* Transcript (revealed after scoring) */}
            {revealTranscript && (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <SignpostBig size={15} className="text-emerald-600" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">Lecture Transcript</span>
                </div>
                <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{selected.content}</p>
              </div>
            )}

            {result && (
              <div ref={resultsRef} className="pt-6">
                <div className="text-center mb-8">
                  <span className="text-emerald-600 font-black text-xs uppercase tracking-[0.3em]">Evaluation & Coaching</span>
                  <h2 className="text-3xl font-black text-slate-900 mt-1">Your SST Result</h2>
                </div>
                <SSTResultDetails result={result} />
                <div className="text-center mt-10">
                  <button onClick={backToList} className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm">
                    Practise Another Lecture <ArrowRight size={16} />
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
                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><CreditCard size={18} className="text-emerald-600" /> Buy SST Credits</h2>
                <p className="text-slate-500 text-sm mt-1">{creditsRemaining === 0 ? "You've used your free SST scorings. Purchase to keep practising." : 'Top up your SST scoring credits.'}</p>
              </div>
              <button onClick={() => setShowPurchase(false)} className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"><X size={16} /></button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 mt-5">
              {SST_PACKAGES.map(pkg => {
                const isUnl = pkg.scoring === -1;
                const buying = purchasingPkg === pkg.id;
                return (
                  <div key={pkg.id} className={`relative rounded-3xl border-2 p-5 ${pkg.popular ? 'border-emerald-400 ring-2 ring-emerald-200' : 'border-slate-200'}`}>
                    {pkg.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">Most Popular</span>}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black uppercase tracking-widest text-slate-500">{pkg.label}</span>
                      <span className="text-2xl font-black text-slate-900">{(pkg.price / 1000).toFixed(pkg.price % 1000 === 0 ? 0 : 1)}k <span className="text-xs text-slate-400">LKR</span></span>
                    </div>
                    <p className="text-sm text-slate-600 font-semibold mb-4 flex items-center gap-1.5">
                      {isUnl ? <><InfinityIcon size={15} className="text-emerald-600" /> Unlimited scorings · 40 days</> : <><Zap size={14} className="text-emerald-600" /> {pkg.scoring} SST scorings</>}
                    </p>
                    <button onClick={() => handlePurchase(pkg.id)} disabled={!!purchasingPkg} className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-50">
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
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-5"><Lock size={30} className="text-emerald-600" /></div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Sign In Required</h2>
            <p className="text-slate-500 text-sm mb-6">Create a SmartLabs account to use the SST trainer. AI scoring runs on credits — purchase a pack anytime.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/signup" className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-xl text-sm text-center" onClick={() => setShowSignIn(false)}>Create Free Account</Link>
              <Link href="/login" className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold px-6 py-3 rounded-xl text-sm text-center" onClick={() => setShowSignIn(false)}>Sign In</Link>
            </div>
            <button onClick={() => setShowSignIn(false)} className="mt-4 text-xs text-slate-400 hover:text-slate-600 font-bold">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AISSTPracticePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-400">Loading…</div>}>
      <SSTInner />
    </Suspense>
  );
}
