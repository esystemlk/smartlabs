'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { scorePteSpeaking, type SpeakingScore } from '@/ai/flows/score-pte-speaking';
import {
  Mic, Square, Loader2, RotateCcw, Play, Search, ChevronLeft, ChevronRight,
  Shuffle, Volume2, ArrowLeft, Sparkles, ListChecks, AlertTriangle,
} from 'lucide-react';

// Fixed theme classes per catalogue hue (Tailwind can't build dynamic names).
const THEME: Record<string, { text: string; bg: string; soft: string; grad: string; ring: string; bar: string }> = {
  orange:  { text: 'text-orange-600',  bg: 'bg-orange-600',  soft: 'bg-orange-500/10',  grad: 'from-orange-500 to-amber-500',   ring: 'ring-orange-500/30',  bar: 'bg-orange-500' },
  violet:  { text: 'text-violet-600',  bg: 'bg-violet-600',  soft: 'bg-violet-500/10',  grad: 'from-violet-500 to-purple-500',  ring: 'ring-violet-500/30',  bar: 'bg-violet-500' },
  blue:    { text: 'text-blue-600',    bg: 'bg-blue-600',    soft: 'bg-blue-500/10',    grad: 'from-blue-500 to-cyan-500',      ring: 'ring-blue-500/30',    bar: 'bg-blue-500' },
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', soft: 'bg-emerald-500/10', grad: 'from-emerald-500 to-green-500',  ring: 'ring-emerald-500/30', bar: 'bg-emerald-500' },
  rose:    { text: 'text-rose-600',    bg: 'bg-rose-600',    soft: 'bg-rose-500/10',    grad: 'from-rose-500 to-pink-500',      ring: 'ring-rose-500/30',    bar: 'bg-rose-500' },
  amber:   { text: 'text-amber-600',   bg: 'bg-amber-600',   soft: 'bg-amber-500/10',   grad: 'from-amber-500 to-yellow-500',   ring: 'ring-amber-500/30',   bar: 'bg-amber-500' },
  cyan:    { text: 'text-cyan-600',    bg: 'bg-cyan-600',    soft: 'bg-cyan-500/10',    grad: 'from-cyan-500 to-sky-500',       ring: 'ring-cyan-500/30',    bar: 'bg-cyan-500' },
};
const theme = (c: string) => THEME[c] ?? THEME.blue;

export interface SpeakingQuestion { id: string }

interface Props<Q extends SpeakingQuestion> {
  taskType: string;
  title: string;
  subtitle: string;
  color: string;
  weight: string;
  questions: Q[];
  /** Reference text sent to the AI (paragraph / sentence / question / gist). */
  getPromptText: (q: Q) => string;
  /** What the student sees on screen. */
  renderPrompt: (q: Q) => React.ReactNode;
  /** Text used for the search box. */
  searchText: (q: Q) => string;
  /** If set, the prompt is spoken aloud (TTS) before the student records. */
  speakPrompt?: (q: Q) => string | null;
  prepSeconds: number;
  recordSeconds: number;
  /** Short "how it works" line under the title. */
  instructions: string;
}

type Phase = 'idle' | 'listening' | 'prep' | 'recording' | 'scoring' | 'result' | 'error';

export function SpeakingTrainer<Q extends SpeakingQuestion>(p: Props<Q>) {
  const t = theme(p.color);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<SpeakingScore | null>(null);
  const [errMsg, setErrMsg] = useState('');

  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? p.questions.filter(x => p.searchText(x).toLowerCase().includes(q)) : p.questions;
  }, [query, p.questions]); // eslint-disable-line
  const question = filtered[index] ?? filtered[0] ?? p.questions[0];

  const clearTimer = () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; } };
  const stopStream = () => { streamRef.current?.getTracks().forEach(tr => tr.stop()); streamRef.current = null; };

  const reset = useCallback(() => {
    clearTimer(); stopStream();
    if (mediaRef.current && mediaRef.current.state !== 'inactive') { try { mediaRef.current.stop(); } catch { /* ignore */ } }
    mediaRef.current = null; chunksRef.current = [];
    setPhase('idle'); setResult(null); setErrMsg(''); setCount(0);
  }, []);

  // Reset whenever the question changes.
  useEffect(() => { reset(); }, [question?.id, reset]);
  useEffect(() => () => { clearTimer(); stopStream(); }, []);

  const speak = (text: string) => new Promise<void>((resolve) => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; u.onend = () => resolve(); u.onerror = () => resolve();
      window.speechSynthesis.speak(u);
    } catch { resolve(); }
  });

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : '';
      const mr = new MediaRecorder(stream, mime ? { mimeType: mime, audioBitsPerSecond: 32000 } : undefined);
      chunksRef.current = [];
      mr.ondataavailable = e => { if (e.data.size) chunksRef.current.push(e.data); };
      mr.onstop = () => { stopStream(); void submit(); };
      mediaRef.current = mr;
      mr.start();
      setPhase('recording');
      setCount(p.recordSeconds);
      clearTimer();
      timerRef.current = setInterval(() => setCount(c => {
        if (c <= 1) { clearTimer(); stopRecording(); return 0; }
        return c - 1;
      }), 1000);
    } catch {
      setErrMsg('Microphone access was blocked. Please allow the mic and try again.');
      setPhase('error');
    }
    // eslint-disable-next-line
  }, [p.recordSeconds]);

  const beginPrep = useCallback(async () => {
    setResult(null); setErrMsg('');
    // Optionally play the prompt aloud first.
    const toSpeak = p.speakPrompt?.(question);
    if (toSpeak) { setPhase('listening'); await speak(toSpeak); }
    setPhase('prep');
    setCount(p.prepSeconds);
    clearTimer();
    timerRef.current = setInterval(() => setCount(c => {
      if (c <= 1) { clearTimer(); void startRecording(); return 0; }
      return c - 1;
    }), 1000);
  }, [question, p, startRecording]); // eslint-disable-line

  const stopRecording = () => {
    clearTimer();
    if (mediaRef.current && mediaRef.current.state !== 'inactive') mediaRef.current.stop();
  };

  const submit = async () => {
    setPhase('scoring');
    try {
      const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || 'audio/webm' });
      if (blob.size < 800) { setErrMsg('We could not hear any speech. Please try again.'); setPhase('error'); return; }
      const audioDataUri: string = await new Promise((res, rej) => {
        const r = new FileReader(); r.onloadend = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(blob);
      });
      const score = await scorePteSpeaking({ taskType: p.taskType, promptText: p.getPromptText(question), audioDataUri });
      setResult(score); setPhase('result');
    } catch (e: unknown) {
      setErrMsg(e instanceof Error ? e.message : 'Scoring failed. Please try again.');
      setPhase('error');
    }
  };

  const go = (d: number) => { const n = (index + d + filtered.length) % filtered.length; setIndex(n); };
  const rand = () => setIndex(Math.floor(Math.random() * filtered.length));

  const busy = phase === 'prep' || phase === 'recording' || phase === 'listening' || phase === 'scoring';

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Practice Hub</Link>
          <h1 className={`text-2xl md:text-3xl font-black tracking-tight ${t.text}`}>{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
        </div>
        <span className={`hidden sm:inline-flex items-center gap-1 rounded-full ${t.soft} ${t.text} px-3 py-1 text-xs font-bold`}><Sparkles className="h-3 w-3" /> AI Score · {p.weight}</span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="min-w-0 space-y-4">
          <div className={`rounded-2xl border-2 bg-card p-5 md:p-6 ${busy ? `ring-2 ${t.ring}` : ''}`}>
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.instructions}</p>
            <div className="min-h-[120px]">{p.renderPrompt(question)}</div>
          </div>

          {/* Recorder */}
          <div className="rounded-2xl border bg-card p-5 text-center">
            {phase === 'idle' && (
              <button onClick={beginPrep} className={`inline-flex items-center gap-2 rounded-xl bg-gradient-to-r ${t.grad} px-6 py-3 text-sm font-bold text-white shadow-sm`}>
                <Mic className="h-4 w-4" /> Start
              </button>
            )}
            {phase === 'listening' && <p className="flex items-center justify-center gap-2 text-sm font-medium"><Volume2 className="h-5 w-5 animate-pulse" /> Listen…</p>}
            {phase === 'prep' && (
              <div>
                <p className="text-sm text-muted-foreground">Get ready — recording starts in</p>
                <p className={`text-4xl font-black ${t.text}`}>{count}</p>
                <button onClick={() => { clearTimer(); void startRecording(); }} className="mt-2 text-xs text-primary underline">Skip & record now</button>
              </div>
            )}
            {phase === 'recording' && (
              <div>
                <div className="mb-2 flex items-center justify-center gap-2 text-rose-600"><span className="h-3 w-3 animate-pulse rounded-full bg-rose-600" /> <span className="font-bold">Recording… {count}s</span></div>
                <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-bold text-white"><Square className="h-4 w-4" /> Stop & Score</button>
              </div>
            )}
            {phase === 'scoring' && <p className="flex items-center justify-center gap-2 text-sm font-medium"><Loader2 className="h-5 w-5 animate-spin" /> Scoring your response with AI…</p>}
            {phase === 'error' && (
              <div className="space-y-3">
                <p className="flex items-center justify-center gap-2 text-sm text-rose-600"><AlertTriangle className="h-4 w-4" /> {errMsg}</p>
                <button onClick={beginPrep} className={`inline-flex items-center gap-2 rounded-xl ${t.bg} px-5 py-2.5 text-sm font-bold text-white`}><RotateCcw className="h-4 w-4" /> Try again</button>
              </div>
            )}
            {phase === 'result' && (
              <button onClick={beginPrep} className={`inline-flex items-center gap-2 rounded-xl ${t.bg} px-5 py-2.5 text-sm font-bold text-white`}><RotateCcw className="h-4 w-4" /> Record again</button>
            )}
          </div>

          {/* Result */}
          {phase === 'result' && result && (
            <div className="rounded-2xl border bg-card p-5 md:p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Your AI Score</h2>
                <div className="text-right">
                  <div className={`text-3xl font-black ${t.text}`}>{Math.round(result.overall)}<span className="text-base text-muted-foreground">/90</span></div>
                  <div className="text-xs text-muted-foreground">Overall</div>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  { label: 'Content', v: result.content, fb: result.contentFeedback },
                  { label: 'Oral Fluency', v: result.fluency, fb: result.fluencyFeedback },
                  { label: 'Pronunciation', v: result.pronunciation, fb: result.pronunciationFeedback },
                ].map(row => (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-sm"><span className="font-medium">{row.label}</span><span className="font-bold">{Math.round(row.v)}/90</span></div>
                    <div className="mt-1 h-2 w-full rounded-full bg-muted"><div className={`h-2 rounded-full ${t.bar}`} style={{ width: `${(row.v / 90) * 100}%` }} /></div>
                    <p className="mt-1 text-xs text-muted-foreground">{row.fb}</p>
                  </div>
                ))}
              </div>
              {result.tips?.length > 0 && (
                <div className={`mt-4 rounded-xl ${t.soft} p-3`}>
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide"><ListChecks className="h-3.5 w-3.5" /> Tips</p>
                  <ul className="list-inside list-disc space-y-0.5 text-sm">{result.tips.map((tip, i) => <li key={i}>{tip}</li>)}</ul>
                </div>
              )}
              <details className="mt-3">
                <summary className="cursor-pointer text-xs font-semibold text-muted-foreground">Show transcript</summary>
                <p className="mt-1 rounded-lg bg-muted/50 p-3 text-sm">{result.transcript || '—'}</p>
              </details>
            </div>
          )}
        </div>

        {/* Question list + search */}
        <div className="rounded-2xl border bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={e => { setQuery(e.target.value); setIndex(0); }} placeholder="Search questions…"
                className="w-full rounded-lg border bg-background py-2 pl-8 pr-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1">
                <button onClick={() => go(-1)} disabled={busy} className="rounded-lg border p-1.5 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => go(1)} disabled={busy} className="rounded-lg border p-1.5 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
                <button onClick={rand} disabled={busy} className="rounded-lg border p-1.5 disabled:opacity-40"><Shuffle className="h-4 w-4" /></button>
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length ? index + 1 : 0} / {filtered.length}</span>
            </div>
          </div>
          <div className="max-h-[52vh] overflow-y-auto p-2">
            {filtered.map((q, i) => (
              <button key={q.id} onClick={() => setIndex(i)} disabled={busy}
                className={`mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${i === index ? `${t.soft} ${t.text} font-semibold` : 'hover:bg-muted/60'}`}>
                {p.searchText(q)}
              </button>
            ))}
            {filtered.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No questions match.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
