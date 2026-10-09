'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { CreditsPill } from '@/components/pte/credits-pill';
import { IeltsEssayResultView } from '@/components/ielts-essay/IeltsEssayResult';
import type { IeltsEssayResult } from '@/types/ielts-essay';
import type { IeltsWritingTest } from '@/lib/ielts-writing/cambridge-21';
import {
  Loader2, PenLine, Sparkles, Target, Lightbulb, ShieldAlert, RotateCcw,
  CreditCard, ImageIcon, ArrowLeft,
} from 'lucide-react';

const CRIMSON = '#dc2626';
const wordsOf = (s: string) => (s.trim() ? s.trim().split(/\s+/).length : 0);

type TaskId = 'task1' | 'task2';
type Phase = 'writing' | 'scoring' | 'result';

// Fetch a same-origin image and return its base64 body (no data: prefix) + mime.
async function imageToBase64(url: string): Promise<{ data: string; mime: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load the task image.');
  const blob = await res.blob();
  const dataUrl: string = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
  const comma = dataUrl.indexOf(',');
  return { data: dataUrl.slice(comma + 1), mime: blob.type || 'image/png' };
}

interface TaskState {
  response: string;
  phase: Phase;
  result: IeltsEssayResult | null;
  error: string | null;
  needCredits: boolean;
  targetBand: number | null;
}
const emptyTask = (): TaskState => ({ response: '', phase: 'writing', result: null, error: null, needCredits: false, targetBand: null });

export function WritingRunner({ test }: { test: IeltsWritingTest }) {
  const router = useRouter();
  const { user, isUserLoading } = useUser();
  const redirect = `/dashboard/ielts/writing/cambridge-${test.book}-test-${test.n}`;

  const [active, setActive] = useState<TaskId>('task1');
  const [t1, setT1] = useState<TaskState>(emptyTask());
  const [t2, setT2] = useState<TaskState>(emptyTask());

  const state = active === 'task1' ? t1 : t2;
  const setState = active === 'task1' ? setT1 : setT2;
  const minWords = active === 'task1' ? 150 : 250;
  const words = wordsOf(state.response);

  function patch(p: Partial<TaskState>) { setState(s => ({ ...s, ...p })); }

  async function submit() {
    if (!user) { router.push(`/login?redirect=${encodeURIComponent(redirect)}`); return; }
    if (words < 40) { patch({ error: 'Please write a fuller response before scoring (at least 40 words).' }); return; }

    patch({ error: null, needCredits: false, phase: 'scoring' });
    try {
      const idToken = await user.getIdToken();
      let res: Response;
      if (active === 'task1') {
        let image: { data: string; mime: string } | null = null;
        try { image = await imageToBase64(test.task1.image); } catch { image = null; }
        res = await fetch('/api/score-ielts-task1', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({
            prompt: test.task1.prompt,
            response: state.response,
            wordCount: words,
            visualType: test.task1.visualType,
            keyFeatures: test.task1.keyFeatures,
            imageBase64: image?.data,
            imageMime: image?.mime,
            targetBand: state.targetBand,
          }),
        });
      } else {
        res = await fetch('/api/score-ielts-essay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ topic: test.task2.prompt, essay: state.response, wordCount: words, targetBand: state.targetBand }),
        });
      }
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'NO_IELTS_CREDITS') { patch({ needCredits: true, phase: 'writing', error: data.error }); return; }
        if (data.code === 'UNAUTHENTICATED' || data.code === 'SESSION_EXPIRED') { router.push(`/login?redirect=${encodeURIComponent(redirect)}`); return; }
        throw new Error(data.error || 'Could not score your response.');
      }
      patch({ result: data as IeltsEssayResult, phase: 'result' });
    } catch (e) {
      patch({ error: e instanceof Error ? e.message : 'Something went wrong. Please try again.', phase: 'writing' });
    }
  }

  function tryAgain() { patch({ phase: 'writing', result: null, error: null }); }

  if (isUserLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="h-7 w-7 animate-spin text-slate-400" /></div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50/40 to-white">
      <div className="max-w-3xl mx-auto px-5 py-10">
        {/* Header */}
        <Link href="/dashboard/ielts/writing" className="inline-flex items-center gap-1.5 text-sm font-bold text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft size={15} /> IELTS Writing
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: CRIMSON }}>
            <PenLine size={22} />
          </div>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em]" style={{ color: CRIMSON }}>Cambridge IELTS {test.book} · Academic Writing</p>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">{test.title}</h1>
          </div>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          AI band scoring on all four official criteria — Task Achievement / Response, Coherence &amp; Cohesion,
          Lexical Resource and Grammatical Range &amp; Accuracy.
        </p>
        <div className="mb-6 flex items-center gap-2">
          {user && <CreditsPill pool="ielts" />}
          <button onClick={() => router.push('/credits')} className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50">
            <CreditCard size={13} /> Buy credits
          </button>
        </div>

        {/* Task tabs */}
        <div className="flex gap-2 mb-6">
          {([['task1', 'Task 1 · Report', '20 min · 150+ words'], ['task2', 'Task 2 · Essay', '40 min · 250+ words']] as const).map(([id, label, sub]) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex-1 rounded-2xl border px-4 py-3 text-left transition-colors ${active === id ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
              style={active === id ? { backgroundColor: CRIMSON } : undefined}
            >
              <span className="block text-sm font-black">{label}</span>
              <span className={`block text-[11px] font-semibold ${active === id ? 'text-red-100' : 'text-slate-400'}`}>{sub}</span>
            </button>
          ))}
        </div>

        {/* Prompt */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4 mb-4">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">
            {active === 'task1' ? 'Writing Task 1' : 'Writing Task 2'}
          </p>
          <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
            {active === 'task1' ? test.task1.prompt : test.task2.prompt}
          </p>
        </div>

        {/* Task 1 visual */}
        {active === 'task1' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-3 mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <ImageIcon size={13} className="text-slate-400" />
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">{test.task1.visualType}</span>
            </div>
            <div className="relative w-full overflow-hidden rounded-xl border border-slate-100 bg-white">
              <Image src={test.task1.image} alt={test.task1.imageAlt} width={1000} height={700} className="w-full h-auto" priority />
            </div>
          </div>
        )}

        {/* WRITING / RESULT */}
        {state.phase === 'result' && state.result ? (
          <div className="space-y-6">
            <IeltsEssayResultView result={state.result} />
            <div className="flex flex-wrap gap-3 justify-center">
              <button onClick={tryAgain} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-black text-sm" style={{ backgroundColor: CRIMSON }}>
                <RotateCcw size={15} /> Try again
              </button>
              {active === 'task1'
                ? <button onClick={() => setActive('task2')} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm">Go to Task 2 →</button>
                : <Link href="/dashboard/ielts/writing" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm">More writing tests</Link>}
            </div>
          </div>
        ) : state.phase === 'scoring' ? (
          <div className="py-24 flex flex-col items-center text-center">
            <Loader2 className="h-10 w-10 animate-spin mb-4" style={{ color: CRIMSON }} />
            <p className="text-sm font-black text-slate-700">Marking your {active === 'task1' ? 'report' : 'essay'} like an IELTS examiner…</p>
            <p className="text-xs text-slate-400 mt-1">This usually takes 15–30 seconds.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <textarea
              value={state.response}
              onChange={e => patch({ response: e.target.value })}
              rows={active === 'task1' ? 12 : 16}
              placeholder={active === 'task1' ? 'Describe the main features and comparisons here…' : 'Write your essay here…'}
              className="w-full resize-none rounded-2xl border border-slate-300 px-4 py-3 text-[15px] leading-relaxed focus:outline-none focus:ring-2 focus:ring-red-400/30"
            />

            <div className="flex items-center justify-between flex-wrap gap-3">
              <span className={`text-xs font-bold ${words < minWords ? 'text-amber-600' : 'text-emerald-600'}`}>
                {words} words {words < minWords && `· aim for ${minWords}+`}
              </span>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-500"><Target size={13} /> Target</span>
                {[6, 6.5, 7, 7.5, 8].map(b => (
                  <button
                    key={b}
                    onClick={() => patch({ targetBand: state.targetBand === b ? null : b })}
                    className={`text-xs font-bold w-9 h-8 rounded-lg border transition-colors ${state.targetBand === b ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`}
                    style={state.targetBand === b ? { backgroundColor: CRIMSON } : undefined}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {state.error && <p className="inline-flex items-center gap-1.5 text-sm font-bold text-red-600"><ShieldAlert size={15} /> {state.error}</p>}
            {state.needCredits && (
              <button onClick={() => router.push('/credits')} className="inline-flex items-center gap-1.5 text-sm font-bold underline" style={{ color: CRIMSON }}>
                <CreditCard size={15} /> Buy IELTS credits →
              </button>
            )}

            <button onClick={submit} className="w-full py-4 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2" style={{ backgroundColor: CRIMSON }}>
              <Sparkles size={16} /> Score my {active === 'task1' ? 'Task 1' : 'essay'}
            </button>

            <p className="inline-flex items-start gap-1.5 text-[11px] text-slate-400">
              <Lightbulb size={13} className="shrink-0 mt-0.5" /> Estimated band for practice. Not an official IELTS result. Each scoring uses one IELTS credit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
