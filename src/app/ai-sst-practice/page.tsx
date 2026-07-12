'use client';

import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { payhereUrls } from '@/lib/payhere';
import { pteSummarizeSpokenTextData, type SpokenTextData } from '@/lib/pte-listening-summarize-spoken-text-data';
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

  const questions = pteSummarizeSpokenTextData;
  const [selected, setSelected] = useState<SpokenTextData | null>(null);

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
    return Math.max(0, FREE_SST_LIMIT - credit.freeUsed);
  }, [credit]);

  // ── Live Form analysis (SST: 50–70 words) ──
  const form = useMemo(() => {
    const t = summary.trim();
    const words = t ? t.split(/\s+/).filter(Boolean).length : 0;
    const ideal = words >= 50 && words <= 70;
    const acceptable = words >= 40 && words <= 100;
    return { words, ideal, acceptable };
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
        body: JSON.stringify({ text: selected.transcript }),
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
        body: JSON.stringify({ transcript: selected.transcript, summary }),
      });
      const data = await res.json();
      if (res.status === 402 || data.code === 'NO_CREDITS') { setShowPurchase(true); return; }
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

  const selectQuestion = (q: SpokenTextData) => {
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
    <div className="min-h-screen bg-white text-slate-900">
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

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight">SMART<span className="text-emerald-600">LABS</span></span>
            <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">PTE 2026</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            <Link href="/" className="flex items-center gap-1.5 hover:text-slate-900"><Home size={15} /> Home</Link>
            <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-slate-900"><LayoutDashboard size={15} /> Dashboard</Link>
            <span className="flex items-center gap-1.5 text-emerald-600"><Headphones size={15} /> SST AI</span>
          </div>
          <div className="flex items-center gap-2">
            {user && credit && (
              <button onClick={() => setShowPurchase(true)} className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-black">
                {unlimited ? <><InfinityIcon size={13} /> Unlimited</> : <>{creditsRemaining} Scoring</>}
                <CreditCard size={13} />
              </button>
            )}
            <button onClick={() => setMobileNavOpen(v => !v)} className="md:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><Menu size={18} /></button>
          </div>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 text-sm font-bold text-slate-700">
            <Link href="/" className="block py-2" onClick={() => setMobileNavOpen(false)}>Home</Link>
            <Link href="/dashboard" className="block py-2" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
          </div>
        )}
      </nav>

      {/* ── CREDIT DASHBOARD BANNER ── */}
      <section className="pt-16 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
            <div className="shrink-0">
              <div className="flex items-center gap-2 mb-1">
                <Headphones size={18} className="text-emerald-500" />
                <span className="text-xs font-black uppercase tracking-widest text-slate-400">AI SST Scoring</span>
              </div>
              <h2 className="text-lg font-extrabold text-white">Your Credit Dashboard</h2>
            </div>
            <div className="hidden md:block w-px h-12 bg-slate-700" />

            {!user && !isUserLoading ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-4 py-3 rounded-2xl">
                  <Lock size={16} className="text-slate-400" />
                  <span className="text-sm font-bold text-slate-300">Sign in to view your credits</span>
                </div>
                <Link href="/login" className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm px-4 py-2.5 rounded-xl transition-all">Sign In</Link>
              </div>
            ) : !credit ? (
              <div className="flex gap-3">{[1, 2].map(i => <div key={i} className="w-36 h-16 rounded-2xl bg-slate-800 animate-pulse" />)}</div>
            ) : (
              <div className="flex flex-wrap gap-3 flex-1">
                <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border flex-1 min-w-[160px] ${unlimited ? 'bg-emerald-900/40 border-emerald-700' : creditsRemaining === 0 ? 'bg-red-900/30 border-red-700' : 'bg-emerald-900/30 border-emerald-700'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${unlimited ? 'bg-emerald-700' : creditsRemaining === 0 ? 'bg-red-700' : 'bg-emerald-700'}`}>
                    <Target size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Scoring Credits</p>
                    {unlimited ? (
                      <div className="flex items-center gap-1.5">
                        <InfinityIcon size={22} className="text-emerald-400" />
                        <span className="text-sm font-black text-emerald-300">Unlimited</span>
                        {isUnlimitedRole && <Crown size={14} className="text-amber-400" />}
                      </div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black tabular-nums ${creditsRemaining === 0 ? 'text-red-400' : 'text-emerald-300'}`}>{creditsRemaining}</span>
                        <span className="text-xs text-slate-500">remaining</span>
                      </div>
                    )}
                  </div>
                </div>

                {!unlimited && credit.paidCredits === 0 && (
                  <div className="flex items-center gap-4 px-5 py-3 rounded-2xl border bg-amber-900/30 border-amber-700 min-w-[160px]">
                    <div className="w-10 h-10 rounded-xl bg-amber-700 flex items-center justify-center shrink-0"><Sparkles size={20} className="text-white" /></div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Free Trial</p>
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black tabular-nums text-amber-300">{Math.max(0, FREE_SST_LIMIT - credit.freeUsed)}</span>
                        <span className="text-xs text-slate-500">/ {FREE_SST_LIMIT} left</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {user && !unlimited && (
              <div className="shrink-0">
                <button onClick={() => setShowPurchase(true)} className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm px-5 py-3 rounded-xl shadow-lg transition-all hover:scale-[1.02]">
                  <CreditCard size={16} /> <span>Buy Credits</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── HERO ── */}
      {!selected && (
        <section className="relative overflow-hidden pt-12 pb-12 border-b border-slate-200">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-100/50 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-[0.2em] mb-4 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200">
              <Headphones size={14} /> AI-Powered Listening Practice
            </div>
            <h1 className="font-display-serif text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight max-w-4xl mx-auto mb-6">
              PTE Summarize Spoken <span className="text-emerald-600 italic">Text</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed mb-12">
              Listen to a predicted lecture, write your 50–70 word summary, and receive instant AI feedback with a Band score, essential-keyword analysis, and a model answer — all based on real Pearson SST marking criteria.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-8">
              {stats.map((stat, i) => (
                <div key={i} className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200 hover:shadow-md transition-shadow">
                  <div className="flex justify-center mb-2">{stat.icon}</div>
                  <div className="text-3xl font-black text-emerald-600 mb-1">{stat.value}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* ── QUESTION SELECTION ── */}
        {!selected && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Choose a Lecture</h2>
            {questions.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                <p className="text-slate-600 font-bold">No lectures available yet.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {questions.map((q, i) => (
                  <button key={q.id ?? i} onClick={() => selectQuestion(q)} className="text-left rounded-3xl border border-slate-200 hover:border-emerald-300 hover:shadow-lg transition-all p-5 group bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Lecture {i + 1}</span>
                      {q.category && <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{q.category}</span>}
                    </div>
                    <h3 className="font-black text-slate-800 mb-1.5 group-hover:text-emerald-700 transition-colors flex items-center gap-2"><Volume2 size={15} className="text-emerald-500" /> {q.title}</h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity">Practise <ArrowRight size={13} /></span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

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
                <button onClick={togglePlay} disabled={audioLoading} className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shrink-0 disabled:opacity-60 shadow-lg shadow-emerald-500/20">
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
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">Your Summary (50–70 words)</label>
              <textarea
                value={summary}
                onChange={e => setSummary(e.target.value)}
                placeholder="Summarise the lecture in 50–70 words, capturing the main topic and essential keywords…"
                rows={6}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
              <div className="flex flex-wrap items-center gap-3 mt-3 text-xs font-semibold">
                <span className={`inline-flex items-center gap-1 ${form.ideal ? 'text-emerald-600' : form.acceptable ? 'text-amber-500' : 'text-red-500'}`}>
                  {form.ideal ? <CheckCircle2 size={14} /> : <XCircle size={14} />} {form.words} words {form.ideal ? '(ideal 50–70)' : '/ aim for 50–70'}
                </span>
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
                <p className="text-[15px] leading-relaxed text-slate-700 whitespace-pre-wrap">{selected.transcript}</p>
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
            <p className="text-slate-500 text-sm mb-6">Create a free SmartLabs account to use the SST trainer — you get {FREE_SST_LIMIT} free scorings.</p>
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
