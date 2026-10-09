'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { useUser, useFirestore } from '@/firebase';
import { IeltsEssayResultView } from '@/components/ielts-essay/IeltsEssayResult';
import type { IeltsEssayResult } from '@/types/ielts-essay';
import { READING_MINUTES, WRITING_MINUTES, LISTENING_PART_GAP_SECONDS, type IeltsMockDef } from '@/lib/ielts-mock/mocks';
import type { IeltsMockResult } from '@/lib/ielts-mock/types';
import {
  Loader2, Headphones, BookOpen, PenLine, Volume2, Clock, ShieldAlert,
  CheckCircle2, ArrowRight, CreditCard, Lock, Wand2, FastForward, Bug, FileDown,
} from 'lucide-react';

// Canned developer sample responses so the Writing AI scorer can run quickly.
const DEV_SAMPLE_T1 = 'The chart provides an overview of the data shown, and several clear trends can be identified. Overall, there are notable differences between the categories, with some rising steadily while others decline over the period in question. The highest figures are found in one category, which increases markedly, whereas the lowest remain broadly stable throughout. In the first part of the period, the values begin at comparable levels before diverging significantly. By the end, the gap between the largest and smallest figures has widened considerably. These contrasts, taken together, highlight the main movements and comparisons that the visual presents to the reader in summary form.';
const DEV_SAMPLE_T2 = 'In recent years this topic has generated considerable debate. While some people firmly support the view expressed in the statement, others disagree, and this essay will examine both perspectives before giving my own opinion. On the one hand, there are compelling reasons to agree. Supporters argue that the benefits are substantial and that the approach addresses a genuine need in modern society, improving outcomes for a large number of people. For example, careful planning can reduce costs and increase efficiency. On the other hand, critics raise valid concerns. They point out that the drawbacks are often underestimated and that unintended consequences can outweigh the advantages if the policy is applied without sufficient safeguards. In my view, a balanced approach is the most sensible. Although the advantages are significant, they can only be realised when accompanied by appropriate regulation and support. In conclusion, both sides of the argument have merit, but on balance I believe the benefits outweigh the disadvantages provided that the issues raised by critics are properly managed.';

type DevAnswers = { listening: Record<number, string>; reading: Record<number, string> };

const CRIMSON = '#dc2626';

// ── Loose shapes for the bundled test JSON ──
interface Question { id: number; part?: number; passage?: number; kind: string; prompt: string; options?: string[]; choices?: { letter: string; text: string }[]; wordLimit?: number; }
interface Group { title?: string; instructions?: string; matchOptions?: { letter: string; text: string }[]; }
interface MapBlock { type: string; startId: number; endId: number; image: string; alt?: string; }
interface ListeningData { sections: { part: number; title: string; subtitle?: string; audio: string }[]; groups: Record<string, Group>; questions: Question[]; blocks?: MapBlock[]; }
interface Passage { title: string; intro?: string; paragraphs: { label?: string; text: string }[]; }
interface ReadingData { passages: Passage[]; groups: Record<string, Group>; questions: Question[]; blocks?: MapBlock[]; }
interface WritingData { task1: { prompt: string; image: string; imageAlt: string; visualType: string }; task2: { prompt: string }; }

type Answers = Record<number, string>;
type Phase = 'intro' | 'listening' | 'reading' | 'writing' | 'submitting' | 'result';

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.max(0, s % 60)).padStart(2, '0')}`;

// Group whose startId <= question id and is the closest such group.
function groupFor(groups: Record<string, Group>, id: number): Group | undefined {
  const starts = Object.keys(groups).map(Number).sort((a, b) => a - b);
  let chosen: number | undefined;
  for (const s of starts) if (s <= id) chosen = s;
  return chosen != null ? groups[String(chosen)] : undefined;
}

function QuestionField({ q, value, onChange }: { q: Question; value: string; onChange: (v: string) => void }) {
  if (q.kind === 'unavailable') return null;
  const hasChoices = Array.isArray(q.choices) && q.choices.length > 0;
  const letters = q.options ?? [];
  return (
    <div className="py-2.5 border-b border-slate-100 last:border-0">
      <div className="flex gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 text-white text-[11px] font-black shrink-0">{q.id}</span>
        <div className="flex-1 min-w-0">
          {q.prompt && <p className="text-sm text-slate-800 leading-relaxed mb-1.5 whitespace-pre-line">{q.prompt}</p>}
          {hasChoices ? (
            <div className="space-y-1">
              {q.choices!.map(c => (
                <label key={c.letter} className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                  <input type="radio" name={`q${q.id}`} checked={value === c.letter} onChange={() => onChange(c.letter)} className="mt-1 accent-red-600" />
                  <span><b className="mr-1">{c.letter}</b>{c.text}</span>
                </label>
              ))}
            </div>
          ) : letters.length > 0 && letters.length <= 10 ? (
            <div className="flex flex-wrap gap-1.5">
              {letters.map(l => (
                <button key={l} type="button" onClick={() => onChange(value === l ? '' : l)}
                  className={`w-9 h-9 rounded-lg border text-sm font-bold transition-colors ${value === l ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                  style={value === l ? { backgroundColor: CRIMSON } : undefined}>{l}</button>
              ))}
            </div>
          ) : (
            <input value={value} onChange={e => onChange(e.target.value)} placeholder="Type your answer…"
              className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30" />
          )}
        </div>
      </div>
    </div>
  );
}

export function IeltsMockRunner({ mock, listening, reading, writing }: { mock: IeltsMockDef; listening: ListeningData; reading: ReadingData; writing: WritingData; }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const redirect = `/dashboard/ielts/mock-tests/${mock.id}`;

  const [isDev, setIsDev] = useState(false);
  const [devAns, setDevAns] = useState<DevAnswers | null>(null);

  const [phase, setPhase] = useState<Phase>('intro');
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [needCredits, setNeedCredits] = useState(false);
  const [starting, setStarting] = useState(false);

  const [lAns, setLAns] = useState<Answers>({});
  const [rAns, setRAns] = useState<Answers>({});
  const [t1, setT1] = useState('');
  const [t2, setT2] = useState('');
  const [result, setResult] = useState<IeltsEssayResult | null>(null);
  const [mockResult, setMockResult] = useState<IeltsMockResult | null>(null);

  // ── Developer debug tools (role === developer/admin) ──
  useEffect(() => {
    if (!user || !firestore) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(firestore, 'users', user.uid));
        const role = snap.data()?.role as string | undefined;
        if (!cancelled && (role === 'developer' || role === 'admin')) {
          setIsDev(true);
          const idToken = await user.getIdToken();
          const res = await fetch(`/api/ielts-mock/dev-answers?mockId=${mock.id}`, { headers: { Authorization: `Bearer ${idToken}` } });
          if (res.ok && !cancelled) setDevAns(await res.json());
        }
      } catch { /* non-fatal */ }
    })();
    return () => { cancelled = true; };
  }, [user, firestore, mock.id]);

  const devFillWriting = useCallback(() => { setT1(DEV_SAMPLE_T1); setT2(DEV_SAMPLE_T2); }, []);

  // ── Start (spends a credit) ──
  async function start() {
    if (!user) { router.push(`/login?redirect=${encodeURIComponent(redirect)}`); return; }
    setStarting(true); setError(null); setNeedCredits(false);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/ielts-mock/start', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ mockId: mock.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NO_IELTS_MOCK_CREDITS') { setNeedCredits(true); setError(data.error); setStarting(false); return; }
        if (data.code === 'UNAUTHENTICATED' || data.code === 'SESSION_EXPIRED') { router.push(`/login?redirect=${encodeURIComponent(redirect)}`); return; }
        throw new Error(data.error || 'Could not start the mock.');
      }
      setAttemptId(data.attemptId);
      setPhase('listening');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the mock.');
    } finally { setStarting(false); }
  }

  async function submitMock() {
    if (!user || !attemptId) return;
    setPhase('submitting'); setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/ielts-mock/score', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ attemptId, mockId: mock.id, listeningAnswers: lAns, readingAnswers: rAns, writingTask1: t1, writingTask2: t2 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not score the mock.');
      setMockResult(data as IeltsMockResult);
      setResult(null);
      setPhase('result');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not score the mock. Your answers are kept — try again.');
      setPhase('writing');
    }
  }

  if (isUserLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Exam top bar */}
      <div className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CRIMSON }}><PenLine size={16} /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 truncate">SmartLabs IELTS Mock</p>
              <p className="text-sm font-black text-slate-900 truncate">{mock.title}</p>
            </div>
          </div>
          <StepPills phase={phase} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-5 py-8">
        {phase === 'intro' && (
          <IntroCard mock={mock} onStart={start} starting={starting} error={error} needCredits={needCredits} onBuy={() => router.push('/dashboard/ielts/mock-tests')} />
        )}
        {phase === 'listening' && (
          <ListeningPhase data={listening} answers={lAns} setAnswers={setLAns} onDone={() => setPhase('reading')} dev={isDev} devAnswers={devAns?.listening} />
        )}
        {phase === 'reading' && (
          <ReadingPhase data={reading} answers={rAns} setAnswers={setRAns} onDone={() => setPhase('writing')} dev={isDev} devAnswers={devAns?.reading} />
        )}
        {phase === 'writing' && (
          <WritingPhase writing={writing} t1={t1} setT1={setT1} t2={t2} setT2={setT2} onSubmit={submitMock} error={error} dev={isDev} onDevFill={devFillWriting} />
        )}
        {phase === 'submitting' && (
          <div className="py-28 flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: CRIMSON }} />
            <p className="text-sm font-black text-slate-700">Marking your mock — Listening, Reading and Writing…</p>
            <p className="text-xs text-slate-400 mt-1">Writing is scored by AI; this can take up to a minute.</p>
          </div>
        )}
        {phase === 'result' && mockResult && <MockResultView r={mockResult} studentName={user?.displayName || 'Student'} studentEmail={user?.email || undefined} />}
      </div>
    </div>
  );
}

// ─────────────────────────── Step indicator ───────────────────────────
function StepPills({ phase }: { phase: Phase }) {
  const steps: { id: Phase; label: string; icon: React.ReactNode }[] = [
    { id: 'listening', label: 'Listening', icon: <Headphones size={13} /> },
    { id: 'reading', label: 'Reading', icon: <BookOpen size={13} /> },
    { id: 'writing', label: 'Writing', icon: <PenLine size={13} /> },
  ];
  const order: Phase[] = ['intro', 'listening', 'reading', 'writing', 'submitting', 'result'];
  const current = order.indexOf(phase);
  return (
    <div className="hidden sm:flex items-center gap-1.5">
      {steps.map(s => {
        const active = phase === s.id;
        const done = order.indexOf(s.id) < current;
        return (
          <span key={s.id} className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${active ? 'text-white border-transparent' : done ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-white border-slate-200'}`} style={active ? { backgroundColor: CRIMSON } : undefined}>
            {done ? <CheckCircle2 size={13} /> : s.icon} {s.label}
          </span>
        );
      })}
    </div>
  );
}

// ─────────────────────────── Intro ───────────────────────────
function IntroCard({ mock, onStart, starting, error, needCredits, onBuy }: { mock: IeltsMockDef; onStart: () => void; starting: boolean; error: string | null; needCredits: boolean; onBuy: () => void; }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 mb-1">{mock.title}</h1>
        <p className="text-sm text-slate-500 mb-5">A full timed IELTS Academic mock — three skills. Speaking is assessed in person at Smart Labs.</p>

        <div className="space-y-3 mb-6">
          {[
            { icon: <Headphones size={16} />, t: 'Listening', d: `${mock.listening.label} · 4 parts, 40 questions. Audio plays once and cannot be paused; each part auto-advances ${LISTENING_PART_GAP_SECONDS}s after its audio ends.` },
            { icon: <BookOpen size={16} />, t: 'Reading', d: `${mock.reading.label} · 3 passages, 40 questions in ${READING_MINUTES} minutes.` },
            { icon: <PenLine size={16} />, t: 'Writing', d: `${mock.writingLabel} · Task 1 + Task 2 in ${WRITING_MINUTES} minutes, AI-scored.` },
          ].map(x => (
            <div key={x.t} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3.5">
              <span className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CRIMSON }}>{x.icon}</span>
              <div><p className="text-sm font-black text-slate-800">{x.t}</p><p className="text-xs text-slate-500 leading-relaxed">{x.d}</p></div>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3.5 mb-5">
          <p className="text-[12px] text-amber-800 leading-relaxed"><b>Overall band = (Listening + Reading + Writing) ÷ 3.</b> Once you start, the sections run in order and the timers cannot be paused — treat it like the real exam. Starting uses <b>1 IELTS mock credit</b>.</p>
        </div>

        {error && <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 mb-3"><ShieldAlert size={15} /> {error}</p>}
        {needCredits ? (
          <button onClick={onBuy} className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2" style={{ backgroundColor: CRIMSON }}>
            <CreditCard size={16} /> Buy mock credits
          </button>
        ) : (
          <button onClick={onStart} disabled={starting} className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-60" style={{ backgroundColor: CRIMSON }}>
            {starting ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />} {starting ? 'Starting…' : 'Start mock test'}
          </button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── Developer tools ───────────────────────────
function DevStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-4 rounded-2xl border border-dashed border-violet-300 bg-violet-50 px-3 py-2">
      <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-violet-700"><Bug size={12} /> Dev</span>
      {children}
    </div>
  );
}
function DevButton({ icon, label, onClick, disabled }: { icon: React.ReactNode; label: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex items-center gap-1.5 text-[12px] font-bold px-2.5 py-1 rounded-lg bg-white border border-violet-200 text-violet-700 hover:bg-violet-100 disabled:opacity-40">
      {icon} {label}
    </button>
  );
}

// ─────────────────────────── Listening ───────────────────────────
function ListeningPhase({ data, answers, setAnswers, onDone, dev, devAnswers }: { data: ListeningData; answers: Answers; setAnswers: React.Dispatch<React.SetStateAction<Answers>>; onDone: () => void; dev?: boolean; devAnswers?: Record<number, string>; }) {
  const [partIdx, setPartIdx] = useState(0);
  const [gap, setGap] = useState<number | null>(null); // seconds left in the 15s gap after audio ends
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const section = data.sections[partIdx];
  const partNum = section.part;
  const qs = data.questions.filter(q => q.part === partNum && q.kind !== 'unavailable');
  const mapBlock = (data.blocks ?? []).find(b => b.type === 'map' && qs.some(q => q.id >= b.startId && q.id <= b.endId));

  const advance = useCallback(() => {
    if (partIdx + 1 < data.sections.length) { setPartIdx(i => i + 1); setGap(null); }
    else onDone();
  }, [partIdx, data.sections.length, onDone]);

  // Count down the 15s gap, then advance.
  useEffect(() => {
    if (gap == null) return;
    if (gap <= 0) { advance(); return; }
    const t = setTimeout(() => setGap(g => (g == null ? g : g - 1)), 1000);
    return () => clearTimeout(t);
  }, [gap, advance]);

  // Autoplay each part's audio from the start; block pausing.
  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => { /* user gesture already given via Start */ });
    const block = () => { if (el.paused && gap == null) el.play().catch(() => {}); };
    el.addEventListener('pause', block);
    return () => el.removeEventListener('pause', block);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partIdx]);

  const setA = (id: number, v: string) => setAnswers(a => ({ ...a, [id]: v }));
  const group = (id: number) => groupFor(data.groups, id);
  // Show each group's instructions once (at its first question).
  const firstOfGroup = new Set<number>();
  { const seen = new Set<Group>(); for (const q of qs) { const g = group(q.id); if (g && !seen.has(g)) { seen.add(g); firstOfGroup.add(q.id); } } }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-slate-900">Listening · Part {partNum} <span className="text-slate-400 font-bold">of {data.sections.length}</span></h2>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600"><Volume2 size={14} style={{ color: CRIMSON }} /> Plays once · no pause</span>
      </div>

      {dev && (
        <DevStrip>
          <DevButton icon={<Wand2 size={13} />} label="Fill this part" onClick={() => setAnswers(a => { const next = { ...a }; for (const q of qs) if (devAnswers?.[q.id] != null) next[q.id] = devAnswers[q.id]; return next; })} disabled={!devAnswers} />
          <DevButton icon={<FastForward size={13} />} label={partIdx + 1 < data.sections.length ? 'Skip audio → next part' : 'Skip audio → Reading'} onClick={() => { setGap(null); advance(); }} />
        </DevStrip>
      )}

      {/* Hidden-control audio: autoplay, not pausable by the student */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
        <audio ref={audioRef} src={section.audio} autoPlay onEnded={() => setGap(LISTENING_PART_GAP_SECONDS)} className="hidden" />
        {gap == null ? (
          <p className="inline-flex items-center gap-2 text-sm font-bold text-slate-700"><span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" /><span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: CRIMSON }} /></span> Audio playing — answer as you listen. {section.subtitle && <span className="text-slate-400 font-medium">· {section.subtitle}</span>}</p>
        ) : (
          <p className="inline-flex items-center gap-2 text-sm font-black" style={{ color: CRIMSON }}><Clock size={15} /> Next part in {gap}s…</p>
        )}
      </div>

      {mapBlock && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 mb-4">
          <Image src={mapBlock.image} alt={mapBlock.alt || 'Map'} width={900} height={650} className="w-full h-auto rounded-xl" />
        </div>
      )}

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        {qs.map(q => (
          <div key={q.id}>
            {firstOfGroup.has(q.id) && group(q.id)?.instructions && (
              <p className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg px-3 py-2 my-2 whitespace-pre-line">{group(q.id)!.instructions}</p>
            )}
            <QuestionField q={q} value={answers[q.id] ?? ''} onChange={v => setA(q.id, v)} />
          </div>
        ))}
      </div>

      <p className="text-[11px] text-slate-400 mt-3 text-center">The next part opens automatically when this part&apos;s audio ends. You cannot return to a previous part.</p>
    </div>
  );
}

// ─────────────────────────── Reading ───────────────────────────
function ReadingPhase({ data, answers, setAnswers, onDone, dev, devAnswers }: { data: ReadingData; answers: Answers; setAnswers: React.Dispatch<React.SetStateAction<Answers>>; onDone: () => void; dev?: boolean; devAnswers?: Record<number, string>; }) {
  const [left, setLeft] = useState(READING_MINUTES * 60);
  const [pIdx, setPIdx] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const iv = setInterval(() => setLeft(s => { if (s <= 1) { clearInterval(iv); doneRef.current(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(iv);
  }, []);

  const passage = data.passages[pIdx];
  const qs = data.questions.filter(q => q.passage === pIdx && q.kind !== 'unavailable');
  const group = (id: number) => groupFor(data.groups, id);
  const firstOfGroup = new Set<number>();
  { const seen = new Set<Group>(); for (const q of qs) { const g = group(q.id); if (g && !seen.has(g)) { seen.add(g); firstOfGroup.add(q.id); } } }
  const setA = (id: number, v: string) => setAnswers(a => ({ ...a, [id]: v }));
  const low = left <= 300;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 sticky top-[57px] z-20 bg-slate-50 py-2">
        <h2 className="text-lg font-black text-slate-900">Reading · Passage {pIdx + 1} <span className="text-slate-400 font-bold">of {data.passages.length}</span></h2>
        <span className={`inline-flex items-center gap-1.5 text-sm font-black px-3 py-1 rounded-full ${low ? 'bg-red-100 text-red-700' : 'bg-slate-900 text-white'}`}><Clock size={14} /> {fmt(left)}</span>
      </div>

      {dev && (
        <DevStrip>
          <DevButton icon={<Wand2 size={13} />} label="Fill all reading answers" onClick={() => setAnswers(a => ({ ...a, ...(devAnswers ?? {}) }))} disabled={!devAnswers} />
          <DevButton icon={<FastForward size={13} />} label="Skip to Writing" onClick={onDone} />
        </DevStrip>
      )}

      <div className="flex gap-1.5 mb-4">
        {data.passages.map((p, i) => (
          <button key={i} onClick={() => setPIdx(i)} className={`text-xs font-bold px-3 py-1.5 rounded-full border ${i === pIdx ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`} style={i === pIdx ? { backgroundColor: CRIMSON } : undefined}>Passage {i + 1}</button>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:max-h-[70vh] lg:overflow-auto">
          <h3 className="text-base font-black text-slate-900 mb-1">{passage.title}</h3>
          {passage.intro && <p className="text-sm italic text-slate-500 mb-3">{passage.intro}</p>}
          <div className="space-y-3">
            {passage.paragraphs.map((para, i) => (
              <p key={i} className="text-[13.5px] text-slate-700 leading-relaxed">{para.label && <b className="mr-1.5">{para.label}</b>}{para.text}</p>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 lg:max-h-[70vh] lg:overflow-auto">
          {qs.map(q => (
            <div key={q.id}>
              {firstOfGroup.has(q.id) && group(q.id)?.instructions && (
                <p className="text-xs font-semibold text-slate-500 bg-slate-50 rounded-lg px-3 py-2 my-2 whitespace-pre-line">{group(q.id)!.instructions}</p>
              )}
              <QuestionField q={q} value={answers[q.id] ?? ''} onChange={v => setA(q.id, v)} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-5">
        <button onClick={onDone} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-sm" style={{ backgroundColor: CRIMSON }}>
          Finish Reading → Writing <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────── Writing ───────────────────────────
const wordsOf = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);
function WritingPhase({ writing, t1, setT1, t2, setT2, onSubmit, error, dev, onDevFill }: { writing: WritingData; t1: string; setT1: (s: string) => void; t2: string; setT2: (s: string) => void; onSubmit: () => void; error: string | null; dev?: boolean; onDevFill?: () => void; }) {
  const [left, setLeft] = useState(WRITING_MINUTES * 60);
  const [tab, setTab] = useState<'t1' | 't2'>('t1');
  const submitRef = useRef(onSubmit);
  submitRef.current = onSubmit;
  useEffect(() => {
    const iv = setInterval(() => setLeft(s => { if (s <= 1) { clearInterval(iv); submitRef.current(); return 0; } return s - 1; }), 1000);
    return () => clearInterval(iv);
  }, []);
  const low = left <= 300;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-black text-slate-900">Writing</h2>
        <span className={`inline-flex items-center gap-1.5 text-sm font-black px-3 py-1 rounded-full ${low ? 'bg-red-100 text-red-700' : 'bg-slate-900 text-white'}`}><Clock size={14} /> {fmt(left)}</span>
      </div>

      {dev && (
        <DevStrip>
          <DevButton icon={<Wand2 size={13} />} label="Fill sample Task 1 + Task 2" onClick={() => onDevFill?.()} />
          <span className="text-[11px] text-slate-500 self-center">then press Submit ↓</span>
        </DevStrip>
      )}

      <div className="flex gap-2 mb-4">
        {([['t1', 'Task 1 · Report', wordsOf(t1), 150], ['t2', 'Task 2 · Essay', wordsOf(t2), 250]] as const).map(([id, label, w, min]) => (
          <button key={id} onClick={() => setTab(id)} className={`flex-1 rounded-2xl border px-4 py-2.5 text-left ${tab === id ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`} style={tab === id ? { backgroundColor: CRIMSON } : undefined}>
            <span className="block text-sm font-black">{label}</span>
            <span className={`block text-[11px] font-semibold ${tab === id ? 'text-red-100' : w < min ? 'text-amber-600' : 'text-emerald-600'}`}>{w} words · aim {min}+</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-3">
        <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{tab === 't1' ? 'Writing Task 1' : 'Writing Task 2'}</p>
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{tab === 't1' ? writing.task1.prompt : writing.task2.prompt}</p>
      </div>

      {tab === 't1' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3 mb-3">
          <Image src={writing.task1.image} alt={writing.task1.imageAlt} width={1000} height={700} className="w-full h-auto rounded-xl" />
        </div>
      )}

      <textarea value={tab === 't1' ? t1 : t2} onChange={e => (tab === 't1' ? setT1 : setT2)(e.target.value)} rows={tab === 't1' ? 12 : 16}
        placeholder={tab === 't1' ? 'Describe the main features and comparisons…' : 'Write your essay…'}
        className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-400/30" />

      {error && <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600 mt-3"><ShieldAlert size={15} /> {error}</p>}

      <button onClick={onSubmit} className="w-full mt-4 py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2" style={{ backgroundColor: CRIMSON }}>
        <CheckCircle2 size={16} /> Submit mock & get my band
      </button>
      <p className="text-[11px] text-slate-400 mt-2 text-center">Both tasks must have content. The mock is scored across all three skills.</p>
    </div>
  );
}

// ─────────────────────────── Result ───────────────────────────
function BandDonut({ band, label, sub }: { band: number; label: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center">
      <div className="w-20 h-20 mx-auto rounded-full ring-4 ring-red-100 bg-red-50 flex flex-col items-center justify-center mb-2">
        <span className="text-2xl font-black" style={{ color: CRIMSON }}>{band}</span>
      </div>
      <p className="text-sm font-black text-slate-800">{label}</p>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
  );
}

function MockResultView({ r, studentName, studentEmail }: { r: IeltsMockResult; studentName: string; studentEmail?: string }) {
  const [open, setOpen] = useState<'none' | 't1' | 't2'>('none');
  const [pdfLoading, setPdfLoading] = useState(false);

  async function downloadPdf() {
    setPdfLoading(true);
    try {
      const [{ pdf }, { IeltsMockScorePDF }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('@/components/ielts/IeltsMockScorePDF'),
      ]);
      const meta = { studentName, studentEmail, date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' }) };
      const blob = await pdf(<IeltsMockScorePDF meta={meta} result={r} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SmartLabs_IELTS_Mock_${r.title.replace(/[^a-z0-9]+/gi, '_')}_${studentName.replace(/[^a-z0-9]+/gi, '_')}.pdf`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Mock PDF failed', e);
    } finally { setPdfLoading(false); }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-7 text-center">
        <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">Overall mock band</p>
        <p className="text-6xl font-black my-1" style={{ color: CRIMSON }}>{r.overall}</p>
        <p className="text-base font-black text-slate-700">{r.overallLabel}</p>
        <p className="text-xs text-slate-400 mt-2">(Listening {r.listening.band} + Reading {r.reading.band} + Writing {r.writing.band}) ÷ 3 · Speaking is assessed in person.</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <BandDonut band={r.listening.band} label="Listening" sub={`${r.listening.raw}/${r.listening.total} correct`} />
        <BandDonut band={r.reading.band} label="Reading" sub={`${r.reading.raw}/${r.reading.total} correct`} />
        <BandDonut band={r.writing.band} label="Writing" sub={`T1 ${r.writing.task1Band} · T2 ${r.writing.task2Band}`} />
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-sm font-black text-slate-800 mb-2">Writing feedback</p>
        <div className="flex gap-2">
          <button onClick={() => setOpen(open === 't1' ? 'none' : 't1')} className={`flex-1 text-sm font-bold px-3 py-2 rounded-xl border ${open === 't1' ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`} style={open === 't1' ? { backgroundColor: CRIMSON } : undefined}>Task 1 · Band {r.writing.task1Band}</button>
          <button onClick={() => setOpen(open === 't2' ? 'none' : 't2')} className={`flex-1 text-sm font-bold px-3 py-2 rounded-xl border ${open === 't2' ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`} style={open === 't2' ? { backgroundColor: CRIMSON } : undefined}>Task 2 · Band {r.writing.task2Band}</button>
        </div>
      </div>
      {open === 't1' && <IeltsEssayResultView result={r.writing.task1} />}
      {open === 't2' && <IeltsEssayResultView result={r.writing.task2} />}

      <div className="flex flex-wrap gap-3 justify-center">
        <button onClick={downloadPdf} disabled={pdfLoading} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-sm disabled:opacity-60" style={{ backgroundColor: '#0F172A' }}>
          {pdfLoading ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />} {pdfLoading ? 'Preparing PDF…' : 'Download PDF'}
        </button>
        <Link href="/dashboard/ielts/mock-tests" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-sm" style={{ backgroundColor: CRIMSON }}>More mock tests</Link>
        <Link href="/dashboard/ielts" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm">IELTS dashboard</Link>
      </div>
      <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1"><Lock size={11} /> Estimated bands for practice. Not an official IELTS result.</p>
    </div>
  );
}
