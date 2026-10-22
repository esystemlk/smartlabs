'use client';
import {PtePracticeHero,PtePracticeTopbar,PteQuestionLibrary,PtePracticeSession} from '@/components/pte/practice-design';

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

  // The questions endpoint now requires a signed-in user, so wait for auth to
  // settle and send the token — firing on mount would 401 before `user` exists.
  useEffect(() => {
    if (isUserLoading) return;
    if (!user) { setQuestions([]); setLoadingQ(false); return; }

    let cancelled = false;
    setLoadingQ(true);
    (async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/wfd/questions', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (!cancelled) setQuestions(res.ok ? (d.questions ?? []) : []);
      } catch {
        if (!cancelled) setQuestions([]);
      } finally {
        if (!cancelled) setLoadingQ(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, isUserLoading]);

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
    <div className="pte-practice-studio font-sora" data-practice="wfd">
      <audio
        ref={audioRef}
        src={selected?.audioUrl || undefined}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <PtePracticeTopbar kind="wfd" signedIn={!!user} />
      {!selected&&<PtePracticeHero kind="wfd"/>}
      <div className="pte-practice-content" data-session={!!selected}>
        {selected&&<PtePracticeSession kind="wfd" questionTitle={selected.title} hasResult={!!result}/>}

        {!selected&&<PteQuestionLibrary kind="wfd" questions={questions} loading={loadingQ} locked={!user} onSelect={index=>selectQuestion(questions[index])}/>}

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
                  aria-label={isPlaying?'Pause dictation audio':'Play dictation audio'}
                  disabled={!selected.audioUrl || (plays >= MAX_PLAYS && !isPlaying)}
                  className="w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shrink-0 disabled:opacity-40 shadow-lg shadow-blue-500/20"
                >
                  {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800">Listen to the sentence</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selected.audioUrl
                      ? `You have up to ${MAX_PLAYS} plays in this practice mode. Type what you hear.`
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
              <label htmlFor="pte-response" data-response-label className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-3 block">
                Type What You Hear
              </label>
              <textarea
                id="pte-response"
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
