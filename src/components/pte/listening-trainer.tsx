'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Volume2, Loader2, CheckCircle2, XCircle, RotateCcw, ChevronRight, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Interactive Listening variants (deterministic marking). */
export type ListeningVariant = 'mcsa' | 'mcma' | 'fill-blanks' | 'summary' | 'missing-word' | 'highlight-words';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQ = any;

const THEME: Record<string, { text: string; bg: string; soft: string; border: string; ring: string }> = {
  orange:  { text: 'text-orange-600',  bg: 'bg-orange-600',  soft: 'bg-orange-500/10',  border: 'border-orange-500',  ring: 'ring-orange-500/30' },
  amber:   { text: 'text-amber-600',   bg: 'bg-amber-600',   soft: 'bg-amber-500/10',   border: 'border-amber-500',   ring: 'ring-amber-500/30' },
  rose:    { text: 'text-rose-600',    bg: 'bg-rose-600',    soft: 'bg-rose-500/10',    border: 'border-rose-500',    ring: 'ring-rose-500/30' },
  indigo:  { text: 'text-indigo-600',  bg: 'bg-indigo-600',  soft: 'bg-indigo-500/10',  border: 'border-indigo-500',  ring: 'ring-indigo-500/30' },
  cyan:    { text: 'text-cyan-600',    bg: 'bg-cyan-600',    soft: 'bg-cyan-500/10',    border: 'border-cyan-500',    ring: 'ring-cyan-500/30' },
  fuchsia: { text: 'text-fuchsia-600', bg: 'bg-fuchsia-600', soft: 'bg-fuchsia-500/10', border: 'border-fuchsia-500', ring: 'ring-fuchsia-500/30' },
  sky:     { text: 'text-sky-600',     bg: 'bg-sky-600',     soft: 'bg-sky-500/10',     border: 'border-sky-500',     ring: 'ring-sky-500/30' },
  violet:  { text: 'text-violet-600',  bg: 'bg-violet-600',  soft: 'bg-violet-500/10',  border: 'border-violet-500',  ring: 'ring-violet-500/30' },
};
const theme = (c: string) => THEME[c] ?? THEME.orange;

interface Props {
  variant: ListeningVariant;
  title: string;
  subtitle: string;
  color: string;
  weight: string;
  instructions: string;
  questions: AnyQ[];
}

/** Reads text aloud with the browser's speech engine (the "audio" for practice). */
function useSpeech() {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(true);
  useEffect(() => {
    setSupported(typeof window !== 'undefined' && 'speechSynthesis' in window);
    return () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } };
  }, []);
  const speak = useCallback((text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.96; u.pitch = 1;
      u.onstart = () => setSpeaking(true);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    } catch { setSpeaking(false); }
  }, []);
  const stop = useCallback(() => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } setSpeaking(false); }, []);
  return { speak, stop, speaking, supported };
}

export function ListeningTrainer(p: Props) {
  const t = theme(p.color);
  const [index, setIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState(0);
  const { speak, stop, speaking, supported } = useSpeech();

  const question = p.questions[index];
  const audioText: string = String(question?.audioText ?? question?.audioTextStart ?? '');

  const reset = useCallback(() => { setSubmitted(false); setResetToken((n) => n + 1); stop(); }, [stop]);
  const go = (i: number) => { setIndex(i); reset(); };

  // answered/allCorrect are reported up from each variant renderer.
  const [progress, setProgress] = useState({ answered: false, allCorrect: false });
  const onReport = useCallback((r: { answered: boolean; allCorrect: boolean }) => setProgress(r), []);
  const attemptKey = `${question?.id ?? index}-${resetToken}`;

  if (!question) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center text-muted-foreground">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold hover:text-foreground"><ArrowLeft size={15} /> Dashboard</Link>
        <p className="mt-6">No questions available yet for this task.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 md:py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft size={15} /> Dashboard</Link>
          <h1 className={cn('mt-1 text-2xl font-black tracking-tight md:text-3xl', t.text)}>{p.title}</h1>
          <p className="text-sm text-muted-foreground">{p.subtitle}</p>
        </div>
        <span className={cn('shrink-0 rounded-full px-3 py-1 text-xs font-black', t.soft, t.text)}>{p.weight}</span>
      </div>

      {/* Audio card */}
      <div className="rounded-2xl border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
          <Volume2 size={14} /> Audio {p.questions.length > 1 && <span className="ml-auto normal-case tracking-normal">Item {index + 1} / {p.questions.length}</span>}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{p.instructions}</p>
        <button
          onClick={() => (speaking ? stop() : speak(audioText))}
          className={cn('mt-4 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-all active:scale-95', t.bg)}
        >
          {speaking ? <Loader2 size={16} className="animate-spin" /> : <Play size={16} />}
          {speaking ? 'Playing… (tap to stop)' : 'Play audio'}
        </button>
        {!supported && <p className="mt-2 text-xs text-amber-600">Your browser can’t play the audio voice — read the transcript after submitting.</p>}
        {p.variant === 'missing-word' && <p className="mt-2 text-xs text-muted-foreground">The last word is replaced by a beep — choose the word that completes the sentence.</p>}
      </div>

      {/* Interaction */}
      <div className="mt-4 rounded-2xl border bg-card p-5">
        {p.variant === 'mcsa' && <MultiChoice key={attemptKey} q={question} multi={false} submitted={submitted} t={t} onReport={onReport} />}
        {p.variant === 'mcma' && <MultiChoice key={attemptKey} q={question} multi submitted={submitted} t={t} onReport={onReport} />}
        {p.variant === 'summary' && <SummaryChoice key={attemptKey} q={question} submitted={submitted} t={t} onReport={onReport} />}
        {p.variant === 'missing-word' && <MissingWord key={attemptKey} q={question} submitted={submitted} t={t} onReport={onReport} />}
        {p.variant === 'fill-blanks' && <FillBlanks key={attemptKey} q={question} submitted={submitted} t={t} onReport={onReport} />}
        {p.variant === 'highlight-words' && <HighlightWords key={attemptKey} q={question} submitted={submitted} t={t} onReport={onReport} />}

        {submitted && (
          <div className={cn('mt-5 flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold',
            progress.allCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-rose-300 bg-rose-50 text-rose-800')}>
            {progress.allCorrect ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
            {progress.allCorrect ? 'Correct — well done!' : 'Not quite — the correct answer is highlighted.'}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-wrap gap-3">
        {!submitted ? (
          <button onClick={() => setSubmitted(true)} disabled={!progress.answered}
            className={cn('inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-all active:scale-95 disabled:opacity-40', t.bg)}>
            <CheckCircle2 size={16} /> Submit answer
          </button>
        ) : (
          <button onClick={reset} className={cn('inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-extrabold text-white transition-all active:scale-95', t.bg)}>
            <RotateCcw size={16} /> Try again
          </button>
        )}
        {p.questions.length > 1 && (
          <button onClick={() => go((index + 1) % p.questions.length)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-5 py-3 text-sm font-extrabold text-foreground transition-all active:scale-95">
            Next item <ChevronRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

type Th = ReturnType<typeof theme>;
type ReportFn = (r: { answered: boolean; allCorrect: boolean }) => void;

/* ── Multiple choice (single / multiple) ─────────────────────────────────── */
function MultiChoice({ q, multi, submitted, t, onReport }: { q: AnyQ; multi: boolean; submitted: boolean; t: Th; onReport: ReportFn }) {
  const correct = useMemo<Set<string>>(() => new Set(multi ? (q.correctAnswers ?? []) : [q.correctAnswer]), [q, multi]);
  const [sel, setSel] = useState<Set<string>>(new Set());
  useEffect(() => {
    const allCorrect = sel.size === correct.size && [...sel].every((x) => correct.has(x));
    onReport({ answered: sel.size > 0, allCorrect });
  }, [sel, correct, onReport]);
  const toggle = (opt: string) => { if (submitted) return; setSel((prev) => { if (!multi) return new Set([opt]); const n = new Set(prev); n.has(opt) ? n.delete(opt) : n.add(opt); return n; }); };
  return (
    <div>
      {q.question && <p className="mb-3 text-base font-bold">{q.question}</p>}
      <div className="space-y-2.5">
        {(q.options as string[]).map((opt, i) => {
          const chosen = sel.has(opt); const isCorrect = correct.has(opt);
          const good = submitted && isCorrect; const bad = submitted && chosen && !isCorrect;
          return (
            <button key={i} onClick={() => toggle(opt)} disabled={submitted}
              className={cn('flex w-full items-center gap-3 rounded-xl border-2 p-3 text-left transition-all',
                good ? 'border-emerald-400 bg-emerald-50' : bad ? 'border-rose-400 bg-rose-50'
                : chosen ? cn(t.border, t.soft) : 'border-border hover:bg-muted/50', submitted && !good && !bad && 'opacity-60')}>
              <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-black text-white',
                good ? 'bg-emerald-500' : bad ? 'bg-rose-500' : chosen ? t.bg : 'bg-muted-foreground/30')}>{String.fromCharCode(65 + i)}</span>
              <span className="text-sm">{opt}</span>
            </button>
          );
        })}
      </div>
      {multi && !submitted && <p className="mt-2 text-xs text-muted-foreground">Select all answers that apply.</p>}
    </div>
  );
}

/* ── Highlight Correct Summary — pick the best summary ───────────────────── */
function SummaryChoice({ q, submitted, t, onReport }: { q: AnyQ; submitted: boolean; t: Th; onReport: ReportFn }) {
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { onReport({ answered: !!sel, allCorrect: sel === q.correctSummaryId }); }, [sel, q.correctSummaryId, onReport]);
  return (
    <div className="space-y-2.5">
      {(q.summaries as { id: string; text: string }[]).map((s) => {
        const chosen = sel === s.id; const good = submitted && s.id === q.correctSummaryId; const bad = submitted && chosen && s.id !== q.correctSummaryId;
        return (
          <button key={s.id} onClick={() => !submitted && setSel(s.id)} disabled={submitted}
            className={cn('block w-full rounded-xl border-2 p-3.5 text-left text-sm leading-relaxed transition-all',
              good ? 'border-emerald-400 bg-emerald-50' : bad ? 'border-rose-400 bg-rose-50'
              : chosen ? cn(t.border, t.soft) : 'border-border hover:bg-muted/50', submitted && !good && !bad && 'opacity-60')}>
            {s.text}
          </button>
        );
      })}
    </div>
  );
}

/* ── Select Missing Word ─────────────────────────────────────────────────── */
function MissingWord({ q, submitted, t, onReport }: { q: AnyQ; submitted: boolean; t: Th; onReport: ReportFn }) {
  const [sel, setSel] = useState<string | null>(null);
  useEffect(() => { onReport({ answered: !!sel, allCorrect: sel === q.correctAnswer }); }, [sel, q.correctAnswer, onReport]);
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground italic">“…{q.audioTextStart} <span className="font-black not-italic">[beep]</span>”</p>
      <div className="flex flex-wrap gap-2.5">
        {(q.options as string[]).map((opt, i) => {
          const chosen = sel === opt; const good = submitted && opt === q.correctAnswer; const bad = submitted && chosen && opt !== q.correctAnswer;
          return (
            <button key={i} onClick={() => !submitted && setSel(opt)} disabled={submitted}
              className={cn('rounded-xl border-2 px-4 py-2.5 text-sm font-bold transition-all',
                good ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : bad ? 'border-rose-400 bg-rose-50 text-rose-800'
                : chosen ? cn(t.border, t.soft, t.text) : 'border-border hover:bg-muted/50')}>{opt}</button>
          );
        })}
      </div>
    </div>
  );
}

/* ── Fill in the Blanks — type each missing word ─────────────────────────── */
function FillBlanks({ q, submitted, t, onReport }: { q: AnyQ; submitted: boolean; t: Th; onReport: ReportFn }) {
  const parts: string[] = String(q.transcript).split('{BLANK}');
  const correctWords: string[] = q.correctWords ?? [];
  const [vals, setVals] = useState<string[]>(() => Array(correctWords.length).fill(''));
  useEffect(() => {
    const answered = vals.every((v) => v.trim());
    const allCorrect = vals.every((v, i) => v.trim().toLowerCase() === String(correctWords[i] ?? '').toLowerCase());
    onReport({ answered, allCorrect });
  }, [vals, correctWords, onReport]);
  return (
    <p className="text-base leading-loose">
      {parts.map((part, i) => {
        const isCorrect = submitted && vals[i]?.trim().toLowerCase() === String(correctWords[i] ?? '').toLowerCase();
        return (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <span className="inline-flex items-center">
                <input
                  value={vals[i] ?? ''} disabled={submitted}
                  onChange={(e) => setVals((a) => { const n = [...a]; n[i] = e.target.value; return n; })}
                  className={cn('mx-1 w-28 rounded-md border-b-2 bg-muted/40 px-2 py-0.5 text-center text-sm font-bold focus:outline-none',
                    submitted ? (isCorrect ? 'border-emerald-500 text-emerald-700' : 'border-rose-500 text-rose-700') : cn(t.border))}
                />
                {submitted && !isCorrect && <span className="text-xs font-bold text-emerald-600">({correctWords[i]})</span>}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </p>
  );
}

/* ── Highlight Incorrect Words — click words that differ from the audio ───── */
function HighlightWords({ q, submitted, t, onReport }: { q: AnyQ; submitted: boolean; t: Th; onReport: ReportFn }) {
  const words: string[] = q.transcript ?? [];
  const incorrect = useMemo<Set<string>>(() => new Set((q.incorrectWords ?? []).map((w: string) => w.toLowerCase())), [q]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  useEffect(() => {
    const chosenWords = [...picked].map((i) => words[i]?.replace(/[.,!?;:]/g, '').toLowerCase());
    const allTargets = [...incorrect];
    const allCorrect = chosenWords.length === allTargets.length && chosenWords.every((w) => incorrect.has(w));
    onReport({ answered: picked.size > 0, allCorrect });
  }, [picked, words, incorrect, onReport]);
  const toggle = (i: number) => { if (submitted) return; setPicked((prev) => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; }); };
  return (
    <p className="text-base leading-loose">
      {words.map((w, i) => {
        const clean = w.replace(/[.,!?;:]/g, '').toLowerCase();
        const isTarget = incorrect.has(clean); const chosen = picked.has(i);
        const good = submitted && chosen && isTarget; const bad = submitted && chosen && !isTarget; const missed = submitted && !chosen && isTarget;
        return (
          <span key={i}>
            <button onClick={() => toggle(i)} disabled={submitted}
              className={cn('rounded px-0.5 transition-colors',
                good ? 'bg-emerald-200 text-emerald-900' : bad ? 'bg-rose-200 text-rose-900 line-through'
                : missed ? 'bg-amber-200 text-amber-900' : chosen ? cn(t.soft, t.text) : 'hover:bg-muted')}>{w}</button>{' '}
          </span>
        );
      })}
      {submitted && <span className="mt-2 block text-xs text-muted-foreground">Green = correct · red = wrong pick · amber = missed word.</span>}
    </p>
  );
}
