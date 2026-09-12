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
  const [revealed, setRevealed] = useState(false);
  const [resetToken, setResetToken] = useState(0); // bumped on Redo to remount the answer UI
  const [elapsed, setElapsed] = useState(0);       // count-up timer (seconds)
  const [translateOn, setTranslateOn] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? p.questions.filter((x) => labelOf(p.variant, x).toLowerCase().includes(q)) : p.questions;
  }, [query, p.questions, p.variant]);
  const question = filtered[index] ?? filtered[0] ?? p.questions[0];

  // Count-up timer — starts on load, resets on question change / Redo, keeps counting.
  useEffect(() => {
    const id = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [question?.id, resetToken]);

  // New question → fresh attempt.
  useEffect(() => {
    setRevealed(false);
    setElapsed(0);
    setResetToken((n) => n + 1);
  }, [question?.id]);

  const redo = useCallback(() => {
    setRevealed(false);
    setElapsed(0);
    setResetToken((n) => n + 1);
  }, []);

  const go = (d: number) => {
    if (!filtered.length) return;
    setIndex((i) => (i + d + filtered.length) % filtered.length);
  };
  const rand = () => filtered.length && setIndex(Math.floor(Math.random() * filtered.length));

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
              {p.variant === 'dropdown' && <DropdownFIB key={attemptKey} q={question} revealed={revealed} t={t} />}
              {p.variant === 'dragdrop' && <DragDropFIB key={attemptKey} q={question} revealed={revealed} t={t} />}
              {p.variant === 'mcma' && <MultiChoice key={attemptKey} q={question} multi revealed={revealed} t={t} />}
              {p.variant === 'mcsa' && <MultiChoice key={attemptKey} q={question} multi={false} revealed={revealed} t={t} />}
              {p.variant === 'reorder' && <ReorderQ key={attemptKey} q={question} revealed={revealed} t={t} />}
            </div>
          </div>

          {/* Controls: See Answer · Redo · Translate */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setRevealed((v) => !v)}
              className={cn('inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-sm', `bg-gradient-to-r ${t.grad}`)}
            >
              <Eye className="h-4 w-4" /> {revealed ? 'Hide Answer' : 'See Answer'}
            </button>
            <button onClick={redo} className="inline-flex items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold hover:bg-muted">
              <RotateCcw className="h-4 w-4" /> Redo
            </button>
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
function DropdownFIB({ q, revealed, t }: { q: AnyQ; revealed: boolean; t: Th }) {
  const [picked, setPicked] = useState<Record<string, string>>({});
  const parts = q.passage.split(/\{\d+\}/);
  return (
    <div className="text-lg leading-loose">
      {parts.map((part: string, i: number) => {
        const blank = q.blanks[i];
        return (
          <React.Fragment key={i}>
            {part}
            {blank && (() => {
              const val = picked[blank.id];
              const correct = revealed && val === blank.correctAnswer;
              const wrong = revealed && val && val !== blank.correctAnswer;
              return (
                <>
                  <Select value={val} onValueChange={(v) => setPicked((s) => ({ ...s, [blank.id]: v }))} disabled={revealed}>
                    <SelectTrigger className={cn('mx-1 inline-flex h-8 w-auto text-base font-semibold align-baseline',
                      correct && 'border-green-500 text-green-700',
                      wrong && 'border-red-500 text-red-700')}>
                      <SelectValue placeholder="Select…" />
                    </SelectTrigger>
                    <SelectContent>
                      {blank.options.map((o: string) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {revealed && !correct && <span className="mx-1 text-sm font-semibold text-green-600">({blank.correctAnswer})</span>}
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
function DragDropFIB({ q, revealed, t }: { q: AnyQ; revealed: boolean; t: Th }) {
  const [bank, setBank] = useState<string[]>(() => shuffle([...q.correctWords, ...q.extraWords]));
  const [answers, setAnswers] = useState<(string | null)[]>(() => Array(q.correctWords.length).fill(null));
  const parts = q.passage.split('{BLANK}');

  const placeWord = (word: string, bankIdx: number) => {
    if (revealed) return;
    const empty = answers.findIndex((a) => a === null);
    if (empty === -1) return;
    setAnswers((a) => { const n = [...a]; n[empty] = word; return n; });
    setBank((b) => b.filter((_, i) => i !== bankIdx));
  };
  const removeWord = (blankIdx: number) => {
    if (revealed) return;
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
              const correct = revealed && val === q.correctWords[i];
              const wrong = revealed && val !== q.correctWords[i];
              return (
                <button
                  onClick={() => removeWord(i)}
                  disabled={revealed}
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
      {revealed ? (
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
function MultiChoice({ q, multi, revealed, t }: { q: AnyQ; multi: boolean; revealed: boolean; t: Th }) {
  const correctSet = useMemo<Set<string>>(
    () => new Set(multi ? q.correctAnswers : [q.correctAnswer]),
    [q, multi],
  );
  const [sel, setSel] = useState<Set<string>>(new Set());
  const toggle = (opt: string) => {
    if (revealed) return;
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
    const good = revealed && isCorrect;
    const bad = revealed && chosen && !isCorrect;
    return (
      <label
        key={opt}
        onClick={() => toggle(opt)}
        className={cn('flex cursor-pointer items-start gap-3 rounded-xl border-2 p-3 text-base transition-colors',
          !revealed && chosen && `${t.border} ${t.soft}`,
          !revealed && !chosen && 'hover:bg-muted/50',
          good && 'border-green-500 bg-green-500/10',
          bad && 'border-red-500 bg-red-500/10',
          revealed && 'cursor-default')}
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
      {revealed && (
        <div className="mt-4 rounded-lg border border-green-500 bg-green-500/10 p-3 text-sm">
          <span className="font-semibold text-green-800">Correct answer{correctSet.size > 1 ? 's' : ''}: </span>
          {[...correctSet].join(' · ')}
        </div>
      )}
    </div>
  );
}

/** Re-order paragraphs — drag to reorder. Correct order is q.paragraphs. */
function ReorderQ({ q, revealed, t }: { q: AnyQ; revealed: boolean; t: Th }) {
  const [items, setItems] = useState<string[]>(() => {
    const s = shuffle(q.paragraphs as string[]);
    // avoid the (rare) already-correct shuffle
    return JSON.stringify(s) === JSON.stringify(q.paragraphs) ? shuffle(s) : s;
  });
  return (
    <div>
      <p className="mb-3 text-sm text-muted-foreground">Drag the boxes into the correct order.</p>
      <Reorder.Group axis="y" values={items} onReorder={(v) => !revealed && setItems(v)} className="space-y-2">
        {items.map((item, i) => {
          const good = revealed && q.paragraphs[i] === item;
          const bad = revealed && q.paragraphs[i] !== item;
          return (
            <Reorder.Item
              key={item}
              value={item}
              dragListener={!revealed}
              className={cn('flex items-center gap-3 rounded-lg border bg-background p-3 text-sm shadow-sm',
                revealed ? 'cursor-default' : 'cursor-grab active:cursor-grabbing',
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
      {revealed && (
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
