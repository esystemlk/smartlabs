'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, AlertTriangle, Home, RotateCcw, ArrowRight, Sparkles } from 'lucide-react';
import { TASK_WEIGHT, bandLabel, type MockTaskScore, type MockOverall, type MockTaskType } from '@/types/mock-test';

const TASK_LABEL: Record<MockTaskType, string> = {
  swt: 'Summarize Written Text',
  'write-essay': 'Write Essay',
  'summarize-spoken-text': 'Summarize Spoken Text',
  'write-from-dictation': 'Write From Dictation',
};

const TASK_SHORT: Record<MockTaskType, string> = {
  swt: 'SWT',
  'write-essay': 'Essay',
  'summarize-spoken-text': 'SST',
  'write-from-dictation': 'WFD',
};

const TASK_COLOR: Record<MockTaskType, string> = {
  'write-essay': '#6366f1',            // indigo
  swt: '#8b5cf6',                      // violet
  'write-from-dictation': '#2563eb',   // blue
  'summarize-spoken-text': '#10b981',  // emerald
};

// PTE Writing runs 10–90; convert a score to a 0–1 fill of that range.
const fillOf = (band: number) => Math.max(0, Math.min(1, (band - 10) / 80));

function bandTone(band: number) {
  if (band >= 79) return { text: 'text-emerald-600', soft: 'text-emerald-700', from: '#10b981', to: '#059669' };
  if (band >= 65) return { text: 'text-blue-600', soft: 'text-blue-700', from: '#3b82f6', to: '#2563eb' };
  if (band >= 50) return { text: 'text-amber-600', soft: 'text-amber-700', from: '#f59e0b', to: '#d97706' };
  return { text: 'text-rose-600', soft: 'text-rose-700', from: '#f43f5e', to: '#e11d48' };
}

/** Semicircular 10 → 90 gauge. Distinctive centrepiece of the report. */
function ScoreGauge({ band, from, to }: { band: number; from: string; to: string }) {
  const R = 92;
  const CX = 120;
  const CY = 120;
  const STROKE = 16;
  const frac = fillOf(band);
  // Semicircle: 180° sweep from left (180°) to right (360°/0°).
  const semi = Math.PI * R;                  // arc length of a semicircle
  const dash = `${semi} ${semi}`;
  const offset = semi * (1 - frac);
  // Marker position along the arc.
  const angle = Math.PI - frac * Math.PI;    // 180° → 0°
  const mx = CX + R * Math.cos(angle);
  const my = CY - R * Math.sin(angle);

  return (
    <svg viewBox="0 0 240 150" className="w-full max-w-[300px]" role="img" aria-label={`Writing score ${band} out of 90`}>
      <defs>
        <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      {/* track */}
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none" stroke="#e2e8f0" strokeWidth={STROKE} strokeLinecap="round"
      />
      {/* progress */}
      <path
        d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
        fill="none" stroke="url(#gaugeGrad)" strokeWidth={STROKE} strokeLinecap="round"
        strokeDasharray={dash} strokeDashoffset={offset}
      />
      {/* marker dot */}
      <circle cx={mx} cy={my} r={7} fill="#fff" stroke={to} strokeWidth={4} />
      {/* endpoints */}
      <text x={CX - R} y={CY + 22} textAnchor="middle" className="fill-slate-400" fontSize="11" fontWeight="700">10</text>
      <text x={CX + R} y={CY + 22} textAnchor="middle" className="fill-slate-400" fontSize="11" fontWeight="700">90</text>
      {/* value */}
      <text x={CX} y={CY - 18} textAnchor="middle" className="fill-slate-900" fontSize="46" fontWeight="900">{band}</text>
      <text x={CX} y={CY + 4} textAnchor="middle" className="fill-slate-400" fontSize="12" fontWeight="700" letterSpacing="2">/ 90</text>
    </svg>
  );
}

export function MockResults({
  title, taskScores, overall, onRetake,
}: {
  title?: string;
  taskScores: MockTaskScore[];
  overall: MockOverall;
  /** Starts a fresh attempt. Costs a credit, so it is always explicit. */
  onRetake?: () => void;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const tone = bandTone(overall.band);

  // Group by task type so the 2 SWTs and 4 dictations read as sections.
  const groups = taskScores.reduce<Record<string, MockTaskScore[]>>((acc, s) => {
    (acc[s.taskType] ??= []).push(s);
    return acc;
  }, {});

  // Ordered by contribution weight, so the report reads high-impact first.
  const orderedTypes = (Object.keys(groups) as MockTaskType[])
    .sort((a, b) => (TASK_WEIGHT[b] ?? 0) - (TASK_WEIGHT[a] ?? 0));

  const avgOf = (list: MockTaskScore[]) =>
    Math.round(list.filter(s => !s.scoreFailed).reduce((s, x) => s + x.percent, 0) / Math.max(1, list.filter(s => !s.scoreFailed).length));

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-5">
      <div className="max-w-3xl mx-auto">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 text-center">Score Report</p>
        <h1 className="text-3xl font-black tracking-tight text-slate-900 text-center mt-1">{title || 'Writing Mock Test'}</h1>

        {/* ── Hero: gauge + two-stage breakdown ───────────────────────────── */}
        <div className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="grid sm:grid-cols-2 gap-6 p-7 items-center">
            <div className="flex flex-col items-center">
              <ScoreGauge band={overall.band} from={tone.from} to={tone.to} />
              <p className={`-mt-1 text-lg font-black ${tone.text}`}>{overall.label}</p>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Writing Score</p>
            </div>

            <div>
              <p className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">How this was calculated</p>
              {/* Stage 1 → Stage 2, made explicit and unique to us. */}
              <div className="flex items-center gap-3">
                <div className="flex-1 rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-center">
                  <p className="text-2xl font-black text-slate-800 tabular-nums">
                    {overall.percentage != null ? `${overall.percentage}%` : '—'}
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-0.5">Weighted %</p>
                </div>
                <ArrowRight size={18} className="text-slate-300 shrink-0" />
                <div className="flex-1 rounded-2xl px-4 py-3 text-center text-white" style={{ background: `linear-gradient(135deg, ${tone.from}, ${tone.to})` }}>
                  <p className="text-2xl font-black tabular-nums">{overall.band}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-white/80 mt-0.5">/ 90 Score</p>
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Score = 10 + (Weighted % × 0.8), on the PTE 10–90 scale.
                Scored {overall.scoredTasks} of {overall.totalTasks} tasks.
              </p>
            </div>
          </div>

          {overall.partial && (
            <div className="px-7 pb-5 -mt-1">
              <p className="inline-flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                Some tasks could not be marked automatically. Your score is based on the tasks that scored, with their weight redistributed.
              </p>
            </div>
          )}
        </div>

        {/* ── Contribution breakdown ──────────────────────────────────────── */}
        <div className="mt-6 rounded-3xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={15} className="text-slate-400" />
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">Contribution to Writing</h2>
          </div>
          <div className="space-y-3">
            {orderedTypes.map(t => {
              const avg = avgOf(groups[t]);
              const weight = TASK_WEIGHT[t] ?? 0;
              return (
                <div key={t} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: TASK_COLOR[t] }} />
                  <span className="text-xs font-black text-slate-600 w-14 shrink-0">{TASK_SHORT[t]}</span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${avg}%`, backgroundColor: TASK_COLOR[t] }} />
                  </div>
                  <span className="text-xs font-black text-slate-700 tabular-nums w-10 text-right">{avg}%</span>
                  <span className="text-[10px] font-bold text-slate-400 tabular-nums w-16 text-right">weight {weight}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Per-task detail ─────────────────────────────────────────────── */}
        <div className="mt-6 space-y-6">
          {orderedTypes.map(type => {
            const t = type as MockTaskType;
            const list = groups[type];
            return (
              <div key={type}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: TASK_COLOR[t] }} />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-700">{TASK_LABEL[t]}</h2>
                  </div>
                  <span className="text-xs font-black text-slate-500">{avgOf(list)}% · weight {TASK_WEIGHT[t]}%</span>
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

        <p className="text-[11px] text-slate-400 text-center mt-8">
          Estimated score for practice. Not an official Pearson result.
        </p>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          {onRetake && (
            <button onClick={onRetake} className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-black text-sm">
              <RotateCcw size={15} /> Retake · uses 1 credit
            </button>
          )}
          <Link href="/mock-tests" className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-black text-sm">
            More Mock Tests
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

// Kept exported-friendly for any caller that wants the label without the component.
export { bandLabel };
