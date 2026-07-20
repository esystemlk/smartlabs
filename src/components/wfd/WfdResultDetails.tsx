'use client';

import React from 'react';
import type { WfdResult } from '@/lib/wfd-scoring';

export interface WfdApiResult extends WfdResult {
  title?: string;
  overallPerformance?: string;
}

const KIND_STYLE: Record<string, { chip: string; label: string }> = {
  correct:    { chip: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: '✓' },
  missing:    { chip: 'bg-red-50 text-red-700 border-red-200 line-through', label: 'missing' },
  incorrect:  { chip: 'bg-red-50 text-red-700 border-red-200', label: 'wrong' },
  misspelled: { chip: 'bg-amber-50 text-amber-800 border-amber-200', label: 'spelling' },
  extra:      { chip: 'bg-slate-100 text-slate-500 border-slate-200', label: 'extra' },
  order:      { chip: 'bg-violet-50 text-violet-700 border-violet-200', label: 'order' },
};

function Stat({ label, value, tone = 'slate' }: { label: string; value: number; tone?: string }) {
  const colors: Record<string, string> = {
    slate: 'text-slate-800', green: 'text-emerald-600', red: 'text-red-600',
    amber: 'text-amber-600', violet: 'text-violet-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 text-center shadow-sm">
      <div className={`text-2xl font-black ${colors[tone]}`}>{value}</div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-0.5 rounded bg-blue-500" />
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}

export function WfdResultDetails({ result: r }: { result: WfdApiResult }) {
  const pct = r.accuracy;
  const scoreTone = r.pteScore >= 79 ? 'emerald' : r.pteScore >= 65 ? 'blue' : r.pteScore >= 50 ? 'amber' : 'red';
  const ring: Record<string, string> = {
    emerald: 'border-emerald-500 text-emerald-600 shadow-[0_0_24px_rgba(16,185,129,0.18)]',
    blue: 'border-blue-500 text-blue-600 shadow-[0_0_24px_rgba(37,99,235,0.18)]',
    amber: 'border-amber-500 text-amber-600 shadow-[0_0_24px_rgba(245,158,11,0.18)]',
    red: 'border-red-500 text-red-600 shadow-[0_0_24px_rgba(239,68,68,0.18)]',
  };

  return (
    <div className="space-y-8">
      {/* Score header */}
      <div className="grid sm:grid-cols-3 gap-5 items-center bg-blue-50 p-5 rounded-3xl border border-blue-200">
        <div className="flex flex-col items-center justify-center">
          <div className={`relative w-32 h-32 rounded-full border-4 flex flex-col items-center justify-center bg-white ${ring[scoreTone]}`}>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">PTE Score</span>
            <span className="text-4xl font-black my-0.5">{r.pteScore}</span>
            <span className="text-slate-400 text-[10px] font-bold">/ 90</span>
          </div>
          <span className="mt-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[11px] font-black uppercase border border-blue-200">
            {pct}% accuracy
          </span>
        </div>
        <div className="sm:col-span-2 space-y-3">
          <p className="text-slate-700 text-sm leading-relaxed font-semibold">{r.overallPerformance}</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            <Stat label="Total" value={r.totalWords} />
            <Stat label="Correct" value={r.correctWords} tone="green" />
            <Stat label="Missing" value={r.missingWords.length} tone="red" />
            <Stat label="Wrong" value={r.incorrectWords.length} tone="red" />
            <Stat label="Spelling" value={r.misspelledWords.length} tone="amber" />
            <Stat label="Extra" value={r.extraWords.length} />
          </div>
        </div>
      </div>

      {/* Word-by-word */}
      <Section title="Word Analysis">
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
          <div className="flex flex-wrap gap-2">
            {r.analysis.map((t, i) => {
              const s = KIND_STYLE[t.kind];
              return (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 text-sm font-semibold border rounded-xl px-2.5 py-1.5 ${s.chip}`}
                  title={t.kind}
                >
                  {t.kind === 'correct' && <span className="text-emerald-500">✓</span>}
                  <span className={t.kind === 'missing' ? 'line-through' : ''}>
                    {t.expected ?? t.actual}
                  </span>
                  {(t.kind === 'incorrect' || t.kind === 'misspelled') && (
                    <>
                      <span className="text-slate-400">←</span>
                      <span className="line-through opacity-70">{t.actual}</span>
                    </>
                  )}
                  {t.kind !== 'correct' && (
                    <span className="text-[9px] font-black uppercase opacity-70">{s.label}</span>
                  )}
                </span>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100 text-[10px] font-bold text-slate-500">
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-200" /> Correct</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-200" /> Missing / Wrong</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-200" /> Misspelled</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-200" /> Extra</span>
            <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-violet-200" /> Wrong order</span>
          </div>
        </div>
      </Section>

      {/* Transcript comparison */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Section title="Official Transcript">
          <div className="bg-emerald-50/50 rounded-2xl border border-emerald-200 p-4">
            <p className="text-sm text-slate-800 leading-relaxed">{r.officialTranscript}</p>
          </div>
        </Section>
        <Section title="Your Answer">
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-sm text-slate-800 leading-relaxed">{r.studentAnswer || <span className="text-slate-400 italic">(empty)</span>}</p>
          </div>
        </Section>
      </div>

      {/* Feedback */}
      {r.feedback.length > 0 && (
        <Section title="Detailed Feedback">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
            <ul className="space-y-1.5">
              {r.feedback.map((f, i) => (
                <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
                  <span className="shrink-0 font-bold text-blue-500">•</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </Section>
      )}
    </div>
  );
}
