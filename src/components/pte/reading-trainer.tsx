'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { Reorder } from 'framer-motion';
import {
  ArrowLeft, Search, ChevronLeft, ChevronRight, Shuffle, Sparkles,
  Eye, RotateCcw, Languages, Timer, CheckCircle2, XCircle, GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

// Fixed theme classes per catalogue hue (Tailwind can't build dynamic names).
const THEME: Record<string, { text: string; bg: string; soft: string; grad: string; ring: string; border: string }> = {
  emerald: { text: 'text-emerald-600', bg: 'bg-emerald-600', soft: 'bg-emerald-500/10', grad: 'from-emerald-500 to-green-500', ring: 'ring-emerald-500/30', border: 'border-emerald-500' },
  teal:    { text: 'text-teal-600',    bg: 'bg-teal-600',    soft: 'bg-teal-500/10',    grad: 'from-teal-500 to-cyan-500',   ring: 'ring-teal-500/30',   border: 'border-teal-500' },
  lime:    { text: 'text-lime-600',    bg: 'bg-lime-600',    soft: 'bg-lime-500/10',    grad: 'from-lime-500 to-green-500',  ring: 'ring-lime-500/30',   border: 'border-lime-500' },
  green:   { text: 'text-green-600',   bg: 'bg-green-600',   soft: 'bg-green-500/10',   grad: 'from-green-500 to-emerald-500', ring: 'ring-green-500/30', border: 'border-green-500' },
  sky:     { text: 'text-sky-600',     bg: 'bg-sky-600',     soft: 'bg-sky-500/10',     grad: 'from-sky-500 to-blue-500',    ring: 'ring-sky-500/30',    border: 'border-sky-500' },
  blue:    { text: 'text-blue-600',    bg: 'bg-blue-600',    soft: 'bg-blue-500/10',    grad: 'from-blue-500 to-cyan-500',   ring: 'ring-blue-500/30',   border: 'border-blue-500' },
};
const theme = (c: string) => THEME[c] ?? THEME.emerald;

export type ReadingVariant = 'dropdown' | 'dragdrop' | 'mcma' | 'reorder' | 'mcsa';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQ = any;

/** What a question renderer reports up to the trainer shell. */
interface AttemptProgress {
  answered: boolean;   // enough input to allow Submit
  allCorrect: boolean; // the confirmed answer is fully correct
}
type ReportFn = (r: AttemptProgress) => void;

interface Props {
  variant: ReadingVariant;
  title: string;
  subtitle: string;
  color: string;
  weight: string;
  instructions: string;
  questions: AnyQ[];
}

const shuffle = <T,>(arr: T[]): T[] => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

/** Best-effort one-line label for the search list. */
function labelOf(variant: ReadingVariant, q: AnyQ): string {
  if (variant === 'reorder') return q.title || q.id;
  if (variant === 'mcma' || variant === 'mcsa') return q.question || q.passage || q.id;
  return q.passage || q.id;
}

export function ReadingTrainer(p: Props) {
  const t = theme(p.color);
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');

  // Per-attempt controls.
  const [submitted, setSubmitted] = useState(false); // user confirmed their own answer
  const [peeked, setPeeked] = useState(false);        // user tapped "See Answer"
  const [progress, setProgress] = useState<AttemptProgress>({ answered: false, allCorrect: false });
  const [resetToken, setResetToken] = useState(0);    // bumped on Redo to remount the answer UI
  const [elapsed, setElapsed] = useState(0);          // count-up timer (seconds)
  const [translateOn, setTranslateOn] = useState(false);

  const graded = submitted || peeked;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? p.questions.filter((x) => labelOf(p.variant, x).toLowerCase().includes(q)) : p.questions;
  }, [query, p.questions, p.variant]);
  const question = filtered[index] ?? filtered[0] ?? p.questions[0];

  // Count-up timer — starts on load, resets on question change / Redo, and
  // freezes once the attempt is graded so the recorded time is the answer time.
  useEffect(() => {
    if (graded) return;
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [question?.id, resetToken, graded]);

  const resetAttempt = useCallback(() => {
    setSubmitted(false);
    setPeeked(false);
    setProgress({ answered: false, allCorrect: false });
    setElapsed(0);
    setResetToken((n) => n + 1);
  }, []);

  // New question → fresh attempt.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { resetAttempt(); }, [question?.id]);

  const go = (d: number) => {
    if (!filtered.length) return;
    setIndex((i) => (i + d + filtered.length) % filtered.length);
  };
  const rand = () => filtered.length && setIndex(Math.floor(Math.random() * filtered.length));

  // Children report their answered/correct state up so we can gate Submit and
  // show the result banner.
  const onReport = useCallback((r: AttemptProgress) => setProgress(r), []);

  // ── Google Website Translator (the in-page "webpage translate" dropdown) ──
  const toggleTranslate = () => {
    const next = !translateOn;
    setTranslateOn(next);
    if (next) loadGoogleTranslate();
  };

  if (!question) {
    return <p className="p-8 text-center text-sm text-muted-foreground">No questions available yet.</p>;
  }

  const attemptKey = `${question.id}-${resetToken}`;

  return (
    <div className="mx-auto w-full max-w-5xl">
      {/* Header */}
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link href="/dashboard" className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Practice Hub
          </Link>
          <h1 className={`text-2xl font-black tracking-tight md:text-3xl ${t.text}`}>{p.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{p.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full ${t.soft} ${t.text} px-3 py-1.5 text-sm font-bold tabular-nums`} aria-live="off">
            <Timer className="h-4 w-4" /> {fmt(elapsed)}
          </span>
          <span className={`hidden items-center gap-1 rounded-full ${t.soft} ${t.text} px-3 py-1.5 text-xs font-bold sm:inline-flex`}>
            <Sparkles className="h-3 w-3" /> {p.weight}
          </span>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <div className="min-w-0 space-y-4">
          <div className="rounded-2xl border-2 bg-card p-5 md:p-6">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{p.instructions}</p>

            {/* Google in-page translate dropdown appears here when enabled. */}
            {translateOn && (
              <div className="mb-4 rounded-xl border bg-muted/40 p-3">
                <div id="google_translate_element" />
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Pick a language above — Google translates this page in place. Choose “English / Show original” to revert.
                </p>
              </div>
            )}

            <div className="min-h-[120px]">
              {p.variant === 'dropdown' && <DropdownFIB key={attemptKey} q={question} graded={graded} onReport={onReport} />}
              {p.variant === 'dragdrop' && <DragDropFIB key={attemptKey} q={question} graded={graded} onReport={onReport} />}
              {p.variant === 'mcma' && <MultiChoice key={attemptKey} q={question} multi graded={graded} t={t} onReport={onReport} />}
              {p.variant === 'mcsa' && <MultiChoice key={attemptKey} q={question} multi={false} graded={graded} t={t} onReport={onReport} />}
              {p.variant === 'reorder' && <ReorderQ key={attemptKey} q={question} graded={graded} onReport={onReport} />}
            </div>

            {/* Result banner after the learner confirms their own answer. */}
            {submitted && (
              <div className={cn('mt-4 flex items-center gap-2 rounded-xl border-2 p-3 text-sm font-bold',
                progress.allCorrect ? 'border-green-500 bg-green-500/10 text-green-700' : 'border-red-500 bg-red-500/10 text-red-700')}>
                {progress.allCorrect
                  ? <><CheckCircle2 className="h-5 w-5" /> Correct — well done!</>
                  : <><XCircle className="h-5 w-5" /> Not quite — the correct answer is highlighted above.</>}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {!graded ? (
              <>
                <button
                  onClick={() => setSubmitted(true)}
                  disabled={!progress.answered}
                  className={cn('inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-40',
                    `bg-gradient-to-r ${t.grad}`)}
                >
                  <CheckCircle2 className="h-4 w-4" /> Submit Answer
                </button>
                <button onClick={() => setPeeked(true)} className="inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold hover:bg-muted">
                  <Eye className="h-4 w-4" /> See Answer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => go(1)}
                  className={cn('inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm', `bg-gradient-to-r ${t.grad}`)}
                >
                  Next Question <ChevronRight className="h-4 w-4" />
                </button>
                <button onClick={resetAttempt} className="inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold hover:bg-muted">
                  <RotateCcw className="h-4 w-4" /> Try Again
                </button>
              </>
            )}
            <button
              onClick={toggleTranslate}
              className={cn(
                'inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold hover:bg-muted',
                translateOn && `${t.border} ${t.text}`,
              )}
            >
              <Languages className="h-4 w-4" /> Translate
            </button>
          </div>
        </div>

        {/* Question list + search */}
        <div className="rounded-2xl border bg-card">
          <div className="border-b p-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setIndex(0); }}
                placeholder="Search questions…"
                className="w-full rounded-lg border bg-background py-2 pl-8 pr-2 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1">
                <button onClick={() => go(-1)} className="rounded-lg border p-1.5 hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                <button onClick={() => go(1)} className="rounded-lg border p-1.5 hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
                <button onClick={rand} className="rounded-lg border p-1.5 hover:bg-muted"><Shuffle className="h-4 w-4" /></button>
              </div>
              <span className="text-xs text-muted-foreground">{filtered.length ? index + 1 : 0} / {filtered.length}</span>
            </div>
          </div>
          <div className="max-h-[52vh] overflow-y-auto p-2">
            {filtered.map((q, i) => (
              <button
                key={q.id ?? i}
                onClick={() => setIndex(i)}
                className={cn(
                  'mb-1 block w-full truncate rounded-lg px-3 py-2 text-left text-sm transition-colors',
                  i === index ? `${t.soft} ${t.text} font-semibold` : 'hover:bg-muted/60',
                )}
              >
                {labelOf(p.variant, q)}
              </button>
            ))}
            {filtered.length === 0 && <p className="p-4 text-center text-sm text-muted-foreground">No questions match.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── Question renderers ────────────────────────────── */

type Th = ReturnType<typeof theme>;

/** Fill in the Blanks (R&W) — dropdown per blank. Passage uses {1}, {2}… */
function DropdownFIB({ q, graded, onReport }: { q: AnyQ; graded: boolean; onReport: ReportFn }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const parts = q.passage.split(/\{\d+\}/);

  useEffect(() => {
    const answered = q.blanks.every((b: AnyQ) => picked[b.id]);
    const allCorrect = q.blanks.every((b: AnyQ) => picked[b.id] === b.correctAnswer);
    onReport({ answered, allCorrect });
  }, [picked, q.blanks, onReport]);

  return (
    <div className="text-lg leading-loose">
      {parts.map((part: string, i: number) => {
        const blank = q.blanks[i];
        return (
          <React.Fragment key={i}>
            {part}
            {blank && (() => {
              const val = picked[blank.id];
              const correct = graded && val === blank.correctAnswer;
              const wrong = graded && val && val !== blank.correctAnswer;
              return (
                <>
                  <Select value={val} onValueChange={(v) => setPicked((s) => ({ ...s, [blank.id]: v }))} disabled={graded}>
                    <SelectTrigger className={cn('mx-1 inline-flex h-8 w-auto text-base font-semibold align-baseline',
                      correct && 'border-green-500 text-green-700',
                      wrong && 'border-red-500 text-red-700')}>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {blank.options.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {graded && !correct && <span className="mx-1 text-sm font-semibold text-green-600">({blank.correctAnswer})</span>}
                </>
              );
            })()}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/** Fill in the Blanks (Drag & Drop) — click a word to drop it into the next blank. */
function DragDropFIB({ q, graded, onReport }: { q: AnyQ; graded: boolean; onReport: ReportFn }) {
  const [bank, setBank] = useState<string[]>(() => shuffle([...q.correctWords, ...q.extraWords]));
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(q.correctWords.length).fill(null));
  const parts = q.passage.split('{BLANK}');

  useEffect(() => {
    const answered = answers.every((a) => a !== null);
    const allCorrect = answers.every((a, i) => a === q.correctWords[i]);
    onReport({ answered, allCorrect });
  }, [answers, q.correctWords, onReport]);

  const placeWord = (word: string, bankIdx: number) => {
    if (graded) return;
    const empty = answers.findIndex((a) => a === null);
    if (empty === -1) return;
    setAnswers((a) => { const n = [...a]; n[empty] = word; return n; });
    setBank((b) => b.filter((_, i) => i !== bankIdx));
  };
  const removeWord = (blankIdx: number) => {
    if (graded) return;
    const word = answers[blankIdx];
    if (!word) return;
    setAnswers((a) => { const n = [...a]; n[blankIdx] = null; return n; });
    setBank((b) => [...b, word]);
  };

  return (
    <div>
      <div className="rounded-lg bg-muted/40 p-4 text-lg leading-loose">
        {parts.map((part: string, i: number) => (
          <span key={i}>
            {part}
            {i < parts.length - 1 && (() => {
              const val = answers[i];
              const correct = graded && val === q.correctWords[i];
              const wrong = graded && val !== q.correctWords[i];
              return (
                <button
                  onClick={() => removeWord(i)}
                  disabled={graded}
                  className={cn('mx-1 inline-flex min-w-[70px] items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/50 px-2 py-0.5 text-base font-semibold align-baseline',
                    val && 'border-solid border-primary',
                    correct && 'border-green-500 bg-green-500/10 text-green-700',
                    wrong && 'border-red-500 bg-red-500/10 text-red-700')}
                >
                  {val || '    '}
                </button>
              );
            })()}
          </span>
        ))}
      </div>
      {graded ? (
        <div className="mt-4 rounded-lg border border-green-500 bg-green-500/10 p-3 text-sm">
          <span className="font-semibold text-green-800">Correct words: </span>
          {q.correctWords.join(' · ')}
        </div>
      ) : (
        <div className="mt-4 rounded-lg border p-3">
          <div className="flex flex-wrap gap-2">
            {bank.map((w, i) => (
              <button key={`${w}-${i}`} onClick={() => placeWord(w, i)} className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-muted">
                {w}
              </button>
            ))}
            {bank.length === 0 && <span className="text-sm text-muted-foreground">All words placed.</span>}
          </div>
        </div>
      )}
    </div>
  );
}

/** Multiple choice — single (radio) or multiple (checkbox). */
function MultiChoice({ q, multi, graded, t, onReport }: { q: AnyQ; multi: boolean; graded: boolean; t: Th; onReport: ReportFn }) {
  const correctSet = useMemo<Set<string>>(
    () => new Set(multi ? q.correctAnswers : [q.correctAnswer]),
    [q, multi],
  );
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    const answered = sel.size > 0;
    const allCorrect = sel.size === correctSet.size && [...sel].every((s) => correctSet.has(s));
    onReport({ answered, allCorrect });
  }, [sel, correctSet, onReport]);

  const toggle = (opt: string) => {
    if (graded) return;
    setSel((prev) => {
      if (!multi) return new Set([opt]);
      const n = new Set(prev);
      n.has(opt) ? n.delete(opt) : n.add(opt);
      return n;
    });
  };

  const rows = (q.options as string[]).map((opt) => {
    const chosen = sel.has(opt);
    const isCorrect = correctSet.has(opt);
    const good = graded && isCorrect;
    const bad = graded && chosen && !isCorrect;
    return (
      <label
        key={opt}
        onClick={() => toggle(opt)}
        className={cn('flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-base transition-colors',
          !graded && chosen && `${t.border} ${t.soft}`,
          !graded && !chosen && 'hover:bg-muted/50',
          good && 'border-green-500 bg-green-500/10',
          bad && 'border-red-500 bg-red-500/10',
          graded && 'cursor-default')}
      >
        {multi
          ? <Checkbox checked={chosen} className="mt-0.5 pointer-events-none" />
          : <RadioGroupItem value={opt} className="mt-0.5 pointer-events-none" />}
        <span className="flex-1">{opt}</span>
        {good && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
        {bad && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
      </label>
    );
  });

  return (
    <div>
      {q.passage && <p className="mb-4 rounded-lg bg-muted/40 p-4 text-base leading-relaxed">{q.passage}</p>}
      <p className="mb-3 font-semibold">{q.question}</p>
      {multi
        ? <div className="space-y-2">{rows}</div>
        : <RadioGroup value={[...sel][0] ?? ''} className="space-y-2">{rows}</RadioGroup>}
      {graded && (
        <div className="mt-4 rounded-lg border border-green-500 bg-green-500/10 p-3 text-sm">
          <span className="font-semibold text-green-800">Correct answer{correctSet.size > 1 ? 's' : ''}: </span>
          {[...correctSet].join(' · ')}
        </div>
      )}
    </div>
  );
}

/** Re-order paragraphs — drag to reorder. Correct order is q.paragraphs. */
function ReorderQ({ q, graded, onReport }: { q: AnyQ; graded: boolean; onReport: ReportFn }) {
  const [items, setItems] = useState<string[]>(() => {
    const s = shuffle(q.paragraphs as string[]);
    // avoid the (rare) already-correct shuffle
    return JSON.stringify(s) === JSON.stringify(q.paragraphs) ? shuffle(s) : s;
  });

  useEffect(() => {
    // A re-order item is always "answered" (there is always an order to submit).
    onReport({ answered: true, allCorrect: JSON.stringify(items) === JSON.stringify(q.paragraphs) });
  }, [items, q.paragraphs, onReport]);

  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Drag the boxes into the correct order.</p>
      <Reorder.Group axis="y" values={items} onReorder={(v) => !graded && setItems(v)} className="space-y-2">
        {items.map((item, i) => {
          const good = graded && q.paragraphs[i] === item;
          const bad = graded && q.paragraphs[i] !== item;
          return (
            <Reorder.Item
              key={item}
              value={item}
              dragListener={!graded}
              className={cn('flex items-center gap-3 rounded-lg border bg-background p-3 text-sm shadow-sm',
                graded ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
                good && 'border-green-500 bg-green-500/10',
                bad && 'border-red-500 bg-red-500/10')}
            >
              <GripVertical className="h-5 w-5 shrink-0 text-muted-foreground" />
              <span className="flex-1">{item}</span>
              {good && <CheckCircle2 className="h-5 w-5 shrink-0 text-green-600" />}
              {bad && <XCircle className="h-5 w-5 shrink-0 text-red-600" />}
            </Reorder.Item>
          );
        })}
      </Reorder.Group>
      {graded && (
        <div className="mt-4 rounded-lg border border-green-500 bg-green-500/10 p-3">
          <p className="mb-2 text-sm font-semibold text-green-800">Correct order:</p>
          <ol className="list-inside list-decimal space-y-1 text-sm">
            {q.paragraphs.map((para: string, i: number) => <li key={i}>{para}</li>)}
          </ol>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── Google Translate loader ────────────────────────────── */

let gtLoaded = false;
function loadGoogleTranslate() {
  if (typeof window === 'undefined' || gtLoaded) return;
  gtLoaded = true;

  // React and Google Translate both mutate the DOM; guard the tree-mutation
  // methods so React's reconciler doesn't crash on nodes Translate moved.
  patchDomForTranslate();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).googleTranslateElementInit = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (g?.translate?.TranslateElement) {
      new g.translate.TranslateElement(
        { pageLanguage: 'en', autoDisplay: false, layout: g.translate.TranslateElement.InlineLayout.SIMPLE },
        'google_translate_element',
      );
    }
  };

  const s = document.createElement('script');
  s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  s.async = true;
  document.body.appendChild(s);
}

let domPatched = false;
function patchDomForTranslate() {
  if (domPatched || typeof Node !== 'function' || !Node.prototype) return;
  domPatched = true;
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) return child;
    return originalRemoveChild.call(this, child) as T;
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) return newNode;
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
