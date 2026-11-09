'use client';

import React, { useState } from 'react';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useUser } from '@/firebase';
import type { IeltsMockReview, MockReviewQuestion } from '@/lib/ielts-mock/types';

type Skill = 'listening' | 'reading';

function answerLabel(q: MockReviewQuestion, value: string) {
  const text = q.options?.find(o => o.letter === value.trim().toUpperCase())?.text;
  return text ? `${value} (${text})` : value;
}

function Row({ q }: { q: MockReviewQuestion }) {
  return (
    <li className="py-3 flex gap-2.5">
      <span className="flex items-center justify-center w-6 h-6 rounded-md bg-slate-900 text-white text-[11px] font-black shrink-0">{q.id}</span>
      <div className="min-w-0 flex-1">
        <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">{q.prompt || `Gap ${q.id}`}</p>
        <p className="text-[13px] text-slate-600 mt-1">Your answer: <b>{q.given.trim() ? answerLabel(q, q.given) : 'No answer'}</b></p>
        {!q.correct && <p className="text-[13px] text-slate-600">Correct answer: <b>{q.accepted.map(a => answerLabel(q, a)).join(' / ')}</b></p>}
        <p className={`inline-flex items-center gap-1 text-xs font-black mt-1 ${q.correct ? 'text-emerald-700' : 'text-red-600'}`}>
          {q.correct ? <CheckCircle2 size={13} /> : <XCircle size={13} />} {q.correct ? 'Correct · 1 mark' : 'Incorrect · 0 marks'}
        </p>
      </div>
    </li>
  );
}

export function MockAnswerReview({ attemptId }: { attemptId: string }) {
  const { user } = useUser();
  const [review, setReview] = useState<IeltsMockReview | null>(null);
  const [skill, setSkill] = useState<Skill>('listening');
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    if (open || review) { setOpen(!open); return; }
    if (!user) return;
    setLoading(true); setError(null);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch(`/api/ielts-mock/review?attemptId=${encodeURIComponent(attemptId)}`, { headers: { Authorization: `Bearer ${idToken}` } });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not load your answers.');
      setReview(data as IeltsMockReview);
      setOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your answers.');
    } finally { setLoading(false); }
  }

  const rows = review?.[skill];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-black text-slate-800">Listening and Reading answers</p>
        <button onClick={toggle} disabled={loading} aria-expanded={open} className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-60">
          {loading && <Loader2 size={13} className="animate-spin" />} {open ? 'Hide answers' : 'Review answers'}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-bold text-red-600">{error}</p>}
      {open && review && (
        <div className="mt-3">
          <div className="flex gap-2">
            {(['listening', 'reading'] as Skill[]).map(s => (
              <button key={s} onClick={() => setSkill(s)} aria-pressed={skill === s} className={`flex-1 text-sm font-bold px-3 py-2 rounded-xl border capitalize ${skill === s ? 'bg-red-600 text-white border-transparent' : 'bg-white border-slate-200 text-slate-600'}`}>{s}</button>
            ))}
          </div>
          {rows
            ? <ul className="divide-y divide-slate-100 mt-1">{rows.map(q => <Row key={q.id} q={q} />)}</ul>
            : <p className="text-sm text-slate-500 mt-3">Answers were not saved for this section of this older mock, so they cannot be shown. Your score is still correct.</p>}
        </div>
      )}
    </div>
  );
}
