'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, AlertTriangle, Home, RotateCcw } from 'lucide-react';
import { TASK_WEIGHT, type MockTaskScore, type MockOverall, type MockTaskType } from '@/types/mock-test';

const TASK_LABEL: Record<MockTaskType, string> = {
  swt: 'Summarize Written Text',
  'write-essay': 'Write Essay',
  'summarize-spoken-text': 'Summarize Spoken Text',
  'write-from-dictation': 'Write From Dictation',
};

const TASK_COLOR: Record<MockTaskType, string> = {
  swt: '#8b5cf6',
  'write-essay': '#f97316',
  'summarize-spoken-text': '#10b981',
  'write-from-dictation': '#2563eb',
};

function bandTone(band: number) {
  if (band >= 79) return { ring: 'border-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (band >= 65) return { ring: 'border-blue-500', text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
  if (band >= 50) return { ring: 'border-amber-500', text: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' };
  return { ring: 'border-red-500', text: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
}

export function MockResults({
  title, taskScores, overall,
}: { title?: string; taskScores: MockTaskScore[]; overall: MockOverall }) {
  const [open, setOpen] = useState<number | null>(null);
  const tone = bandTone(overall.band);

  // Group by task type so the 2 SWTs and 4 dictations read as sections.
  const groups = taskScores.reduce<Record<string, MockTaskScore[]>>((acc, s) => {
    (acc[s.taskType] ??= []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-5">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.25em] text-slate-400 text-center">Mock Test Result</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 text-center mt-1">{title || 'Writing Mock Test'}</h1>

        {/* Overall */}
        <div className={`mt-8 rounded-3xl border p-6 flex flex-col sm:flex-row items-center gap-6 ${tone.bg} ${tone.border}`}>
          <div className={`w-32 h-32 rounded-full border-4 bg-white flex flex-col items-center justify-center shrink-0 ${tone.ring}`}>
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Overall</span>
            <span className={`text-4xl font-black my-0.5 ${tone.text}`}>{overall.band}</span>
            <span className="text-slate-400 text-[10px] font-bold">/ 90</span>
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className={`text-xl font-black ${tone.text}`}>{overall.label}</p>
            <p className="text-sm text-slate-600 mt-1">
              Scored {overall.scoredTasks} of {overall.totalTasks} tasks.
            </p>
            {overall.partial && (
              <p className="mt-3 inline-flex items-start gap-2 text-xs text-amber-800 bg-amber-100 border border-amber-200 rounded-xl px-3 py-2 text-left">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Some tasks could not be marked automatically. Your band is based on the tasks that scored.
              </p>
            )}
            <p className="text-[11px] text-slate-400 mt-3">
              Estimated score for practice. Not an official Pearson result.
            </p>
          </div>
        </div>

        {/* Per-task */}
        <div className="mt-8 space-y-6">
          {Object.entries(groups).map(([type, list]) => {
            const t = type as MockTaskType;
            const avg = Math.round(list.reduce((s, x) => s + x.percent, 0) / list.length);
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TASK_COLOR[t] }} />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">{TASK_LABEL[t]}</h2>
                  </div>
                  <span className="text-xs font-black text-slate-500">
                    {avg}% · weight {Math.round(TASK_WEIGHT[t] * 100)}%
                  </span>
                </div>

                <div className="space-y-2">
                  {list.map((s, i) => {
                    const globalIdx = taskScores.indexOf(s);
                    const isOpen = open === globalIdx;
                    const skipped = (s.detail as { skipped?: boolean } | undefined)?.skipped;
                    return (
                      <div key={globalIdx} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                        <button
                          onClick={() => setOpen(isOpen ? null : globalIdx)}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          <span className="text-xs font-black text-slate-400 w-6">#{i + 1}</span>
                          <div className="flex-1">
                            <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{ width: `${s.percent}%`, backgroundColor: TASK_COLOR[t] }}
                              />
                            </div>
                          </div>
                          <span className="text-sm font-black text-slate-700 tabular-nums w-20 text-right">
                            {s.scoreFailed ? '—' : `${s.raw}/${s.max}`}
                          </span>
                          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                            {s.scoreFailed ? (
                              <p className="text-sm text-amber-700">Could not be marked: {s.error}</p>
                            ) : skipped ? (
                              <p className="text-sm text-slate-500">No answer was given for this question.</p>
                            ) : (
                              <pre className="text-[11px] leading-relaxed text-slate-600 whitespace-pre-wrap max-h-72 overflow-auto bg-slate-50 rounded-xl p-3">
                                {summarise(s)}
                              </pre>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 flex flex-wrap gap-3 justify-center">
          <Link href="/mock-tests" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm">
            <RotateCcw size={15} /> More Mock Tests
          </Link>
          <Link href="/dashboard" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-black text-sm">
            <Home size={15} /> Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Pull the most useful lines out of each scorer's payload. */
function summarise(s: MockTaskScore): string {
  const d = s.detail as Record<string, unknown> | undefined;
  if (!d) return 'No detail available.';
  const lines: string[] = [];

  if (typeof d.summaryText === 'string') lines.push(d.summaryText);
  if (typeof d.overallPerformance === 'string') lines.push(d.overallPerformance);
  if (typeof d.contentJustification === 'string') lines.push(d.contentJustification);

  const fb = d.feedback;
  if (Array.isArray(fb)) lines.push(...fb.map(String));

  const improvements = d.suggestedImprovements ?? d.improvements;
  if (Array.isArray(improvements)) lines.push(...improvements.map(x => `• ${String(x)}`));

  if (Array.isArray(d.criteria)) {
    lines.push(
      ...(d.criteria as { name?: string; score?: number; max?: number }[])
        .map(c => `${c.name}: ${c.score}/${c.max}`)
    );
  }

  return lines.length ? lines.join('\n') : 'Scored — open the trainer for full feedback.';
}
