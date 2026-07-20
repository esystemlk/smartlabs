'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import {
  Headphones, ArrowRight, ArrowLeft, Lock, Loader2, Play, Pause, Home,
  LayoutDashboard, Menu, Volume2, Target, ListChecks, BarChart3, Repeat,
} from 'lucide-react';
import { WfdResultDetails, type WfdApiResult } from '@/components/wfd/WfdResultDetails';

interface WfdQuestion {
  id: string;
  title: string;
  audioUrl: string;
  wordCount: number;
}

/** Real exam allows 3 plays of the dictation audio. */
const MAX_PLAYS = 3;

export default function WfdPracticePage() {
  const { user, isUserLoading } = useUser();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<WfdQuestion[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [selected, setSelected] = useState<WfdQuestion | null>(null);

  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<WfdApiResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const [plays, setPlays] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoadingQ(true);
    fetch('/api/wfd/questions')
      .then(r => r.json())
      .then(d => setQuestions(d.questions ?? []))
      .catch(() => setQuestions([]))
      .finally(() => setLoadingQ(false));
  }, []);

  const wordCount = useMemo(
    () => answer.trim().split(/\s+/).filter(Boolean).length,
    [answer]
  );

  const selectQuestion = (q: WfdQuestion) => {
    setSelected(q);
    setAnswer('');
    setResult(null);
    setPlays(0);
    setIsPlaying(false);
  };

  const backToList = () => {
    setSelected(null);
    setAnswer('');
    setResult(null);
    setPlays(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const togglePlay = async () => {
    const el = audioRef.current;
    if (!el || !selected?.audioUrl) return;
    if (isPlaying) { el.pause(); return; }
    if (plays >= MAX_PLAYS) {
      toast({ variant: 'destructive', title: `You've used all ${MAX_PLAYS} plays for this question.` });
      return;
    }
    try {
      el.currentTime = 0;
      await el.play();
      setPlays(p => p + 1);
    } catch {
      toast({ variant: 'destructive', title: 'Could not play the audio.' });
    }
  };

  const handleSubmit = async () => {
    if (!user) { toast({ variant: 'destructive', title: 'Please sign in to score your answer.' }); return; }
    if (!selected || isSubmitting || !answer.trim()) return;
    setIsSubmitting(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/score-wfd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ questionId: selected.id, answer }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Scoring failed.');
      setResult(data as WfdApiResult);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    } catch (e) {
      toast({ variant: 'destructive', title: e instanceof Error ? e.message : 'Scoring failed.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const stats = [
    { value: String(questions.length), label: 'Dictations', icon: <ListChecks size={22} className="text-blue-600" /> },
    { value: '90', label: 'Max Score', icon: <Target size={22} className="text-blue-600" /> },
    { value: '6', label: 'Error Types', icon: <BarChart3 size={22} className="text-blue-600" /> },
    { value: String(MAX_PLAYS), label: 'Audio Plays', icon: <Repeat size={22} className="text-blue-600" /> },
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <audio
        ref={audioRef}
        src={selected?.audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-black text-lg tracking-tight">SMART<span className="text-blue-600">LABS</span></span>
            <span className="text-[10px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">PTE 2026</span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-bold text-slate-600">
            <Link href="/" className="flex items-center gap-1.5 hover:text-slate-900"><Home size={15} /> Home</Link>
            <Link href="/dashboard" className="flex items-center gap-1.5 hover:text-slate-900"><LayoutDashboard size={15} /> Dashboard</Link>
            <span className="flex items-center gap-1.5 text-blue-600"><Headphones size={15} /> Dictation AI</span>
          </div>
          <button onClick={() => setMobileNavOpen(v => !v)} className="md:hidden w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center"><Menu size={18} /></button>
        </div>
        {mobileNavOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 text-sm font-bold text-slate-700">
            <Link href="/" className="block py-2" onClick={() => setMobileNavOpen(false)}>Home</Link>
            <Link href="/dashboard" className="block py-2" onClick={() => setMobileNavOpen(false)}>Dashboard</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      {!selected && (
        <section className="relative overflow-hidden pt-28 pb-12 border-b border-slate-200">
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-100/50 blur-[120px] rounded-full pointer-events-none -z-10" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center">
            <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-xs uppercase tracking-[0.2em] mb-4 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-200">
              <Headphones size={14} /> Write From Dictation
            </div>
            <h1 className="font-display-serif text-4xl sm:text-5xl md:text-7xl font-black text-slate-900 leading-tight max-w-4xl mx-auto mb-6">
              PTE Write From <span className="text-blue-600 italic">Dictation</span>
            </h1>
            <p className="text-slate-500 text-lg md:text-xl font-medium max-w-3xl mx-auto leading-relaxed mb-12">
              Listen to the sentence and type exactly what you hear. Every word is checked against the
              official transcript — missing, misspelled, extra and out-of-order words are all identified instantly.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto mt-8">
              {stats.map((s, i) => (
                <div key={i} className="p-4 md:p-6 rounded-2xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-center mb-2">{s.icon}</div>
                  <div className="text-3xl font-black text-blue-600 mb-1">{s.value}</div>
                  <div className="text-xs font-bold text-slate-500 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <div className={`max-w-5xl mx-auto px-4 py-10 ${selected ? 'pt-24' : ''}`}>
        {/* ── QUESTION LIST ── */}
        {!selected && (
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700 mb-4">Choose a Dictation</h2>
            {loadingQ ? (
              <div className="flex items-center gap-2 text-slate-400 py-12 justify-center">
                <Loader2 className="animate-spin" size={18} /> Loading dictations…
              </div>
            ) : questions.length === 0 ? (
              <div className="text-center py-16 rounded-3xl border border-dashed border-slate-300 bg-slate-50">
                <p className="text-slate-600 font-bold">No dictations available yet.</p>
                <p className="text-slate-400 text-sm mt-1">New sentences are added by the Smart Labs team — check back soon.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    onClick={() => selectQuestion(q)}
                    className="text-left rounded-3xl border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all p-5 group bg-white"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">Dictation {i + 1}</span>
                      <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {q.wordCount} words
                      </span>
                    </div>
                    <h3 className="font-black text-slate-800 group-hover:text-blue-700 transition-colors flex items-center gap-2">
                      <Volume2 size={15} className="text-blue-500" /> {q.title}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      Practise <ArrowRight size={13} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── PRACTICE ── */}
        {selected && (
          <div>
            <button onClick={backToList} className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-blue-600 mb-4">
              <ArrowLeft size={15} /> All dictations
            </button>

            {/* Audio */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 md:p-8 mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-600">{selected.title}</span>
                <span className={`text-xs font-black px-3 py-1 rounded-full ${plays >= MAX_PLAYS ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-white text-slate-600 border border-slate-200'}`}>
                  {plays} / {MAX_PLAYS} plays
                </span>
              </div>
              <div className="flex items-center gap-4 rounded-2xl bg-white border border-slate-200 p-4">
                <button
                  onClick={togglePlay}
                  disabled={!selected.audioUrl || (plays >= MAX_PLAYS && !isPlaying)}
                  className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 shadow-lg shadow-blue-500/20"
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800">Listen to the sentence</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selected.audioUrl
                      ? `You get ${MAX_PLAYS} plays, like the real exam. Type exactly what you hear.`
                      : 'Audio has not been uploaded for this question yet.'}
                  </p>
                </div>
                <Headphones size={22} className="text-slate-300 shrink-0" />
              </div>
              <p className="text-[11px] text-slate-400 mt-3 flex items-center gap-1.5">
                <Lock size={12} /> The transcript stays hidden until you submit.
              </p>
            </div>

            {/* Answer */}
            <div className="rounded-3xl border border-slate-200 p-6 md:p-8 mb-6">
              <label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">
                Type What You Hear
              </label>
              <textarea
                value={answer}
                onChange={e => setAnswer(e.target.value)}
                placeholder="Type the sentence exactly as you heard it…"
                rows={4}
                className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <div className="flex items-center gap-3 mt-3 text-xs font-semibold text-slate-500">
                <span>{wordCount} words typed</span>
                <span className="text-slate-300">·</span>
                <span>{selected.wordCount} in the original</span>
              </div>

              <div className="mt-5">
                {isUserLoading ? null : !user ? (
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <span className="text-sm text-slate-500 inline-flex items-center gap-2"><Lock size={15} /> Sign in to score your answer.</span>
                    <Link href="/login?redirect=/ai-wfd-practice" className="px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm">Sign In</Link>
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || !answer.trim()}
                    className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-500/20"
                  >
                    {isSubmitting ? (<><Loader2 className="animate-spin" size={18} /> Checking…</>) : (<>Check My Answer <ArrowRight size={16} /></>)}
                  </button>
                )}
              </div>
            </div>

            {result && (
              <div ref={resultsRef} className="pt-6">
                <div className="text-center mb-8">
                  <span className="text-blue-600 font-black text-xs uppercase tracking-[0.3em]">Word-by-Word Analysis</span>
                  <h2 className="text-3xl font-black text-slate-900 mt-1">Your Result</h2>
                </div>
                <WfdResultDetails result={result} />
                <div className="text-center mt-10 flex flex-wrap gap-3 justify-center">
                  <button onClick={() => { setResult(null); setAnswer(''); setPlays(0); }} className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm">
                    <Repeat size={16} /> Try This Again
                  </button>
                  <button onClick={backToList} className="inline-flex items-center gap-2 px-7 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm">
                    Next Dictation <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
