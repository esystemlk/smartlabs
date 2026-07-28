'use client';

import React from 'react';
import { Target, AlertTriangle, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import type { IeltsEssayResult, IeltsCriterion } from '@/types/ielts-essay';

// Crimson is the IELTS part's theme, distinct from the PTE parts.
const CRIMSON = '#dc2626';

function bandTone(band: number) {
  if (band >= 7.5) return { text: 'text-emerald-600', ring: 'ring-emerald-200', bg: 'bg-emerald-50' };
  if (band >= 6) return { text: 'text-red-600', ring: 'ring-red-200', bg: 'bg-red-50' };
  if (band >= 5) return { text: 'text-amber-600', ring: 'ring-amber-200', bg: 'bg-amber-50' };
  return { text: 'text-rose-600', ring: 'ring-rose-200', bg: 'bg-rose-50' };
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-0.5 rounded" style={{ backgroundColor: CRIMSON }} />
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{children}</h3>
    </div>
  );
}

function Bullets({ items, tone = 'slate' }: { items?: string[]; tone?: 'slate' | 'green' | 'red' }) {
  if (!items?.length) return null;
  const dot = tone === 'green' ? 'text-emerald-500' : tone === 'red' ? 'text-red-500' : 'text-slate-400';
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
          <span className={`font-bold ${dot} shrink-0`}>•</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ErrorList({ label, items }: { label: string; items?: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <Bullets items={items} tone="red" />
    </div>
  );
}

function CriterionCard({ c }: { c: IeltsCriterion }) {
  const tone = bandTone(c.band);
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[11px] font-black text-white px-2 py-0.5 rounded" style={{ backgroundColor: CRIMSON }}>{c.code}</span>
          <h4 className="text-sm font-black text-slate-800">{c.name}</h4>
        </div>
        <div className={`flex items-center justify-center w-12 h-12 rounded-full ring-4 ${tone.ring} ${tone.bg}`}>
          <span className={`text-lg font-black ${tone.text}`}>{c.band}</span>
        </div>
      </div>

      {c.reason && <p className="text-sm text-slate-600 leading-relaxed mb-3">{c.reason}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {c.strengths?.length > 0 && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 mb-1">Strengths</p>
            <Bullets items={c.strengths} tone="green" />
          </div>
        )}
        {c.weaknesses?.length > 0 && (
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-red-600 mb-1">Weaknesses</p>
            <Bullets items={c.weaknesses} tone="red" />
          </div>
        )}
      </div>

      {c.evidence?.length ? (
        <div className="mt-3">
          <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">Evidence from essay</p>
          <ul className="space-y-1">
            {c.evidence.map((e, i) => (
              <li key={i} className="text-[13px] text-slate-500 italic border-l-2 border-slate-200 pl-2">“{e}”</li>
            ))}
          </ul>
        </div>
      ) : null}

      {(c.goodVocabulary?.length || c.vocabularyErrors?.length || c.collocationErrors?.length || c.spellingErrors?.length) ? (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          {c.goodVocabulary?.length ? (
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 mb-1">Good vocabulary</p>
              <div className="flex flex-wrap gap-1.5">
                {c.goodVocabulary.map((v, i) => (
                  <span key={i} className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{v}</span>
                ))}
              </div>
            </div>
          ) : null}
          <ErrorList label="Vocabulary errors" items={c.vocabularyErrors} />
          <ErrorList label="Collocation errors" items={c.collocationErrors} />
          <ErrorList label="Spelling errors" items={c.spellingErrors} />
        </div>
      ) : null}

      {(c.sentenceStructureErrors?.length || c.grammarErrors?.length || c.punctuationErrors?.length) ? (
        <div className="mt-3 grid sm:grid-cols-2 gap-3">
          <ErrorList label="Sentence structure" items={c.sentenceStructureErrors} />
          <ErrorList label="Grammar errors" items={c.grammarErrors} />
          <ErrorList label="Punctuation errors" items={c.punctuationErrors} />
        </div>
      ) : null}
    </div>
  );
}

export function IeltsEssayResultView({ result }: { result: IeltsEssayResult }) {
  const tone = bandTone(result.overallBand);
  const t = result.targetBandAnalysis;

  return (
    <div className="space-y-6">
      {/* Overall band */}
      <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className={`w-32 h-32 rounded-full ring-8 ${tone.ring} ${tone.bg} flex flex-col items-center justify-center shrink-0`}>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Overall</span>
          <span className={`text-5xl font-black ${tone.text}`}>{result.overallBand}</span>
          <span className="text-[10px] font-bold text-slate-400">Band</span>
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className={`text-xl font-black ${tone.text}`}>{result.bandLabel}</p>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start mt-2">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">{result.questionType}</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-slate-600">{result.estimatedWordCount} words</span>
          </div>
          {result.overallExplanation && (
            <p className="text-sm text-slate-600 leading-relaxed mt-3">{result.overallExplanation}</p>
          )}
          <p className="text-[11px] text-slate-400 mt-3">Estimated band for practice. Not an official IELTS result.</p>
        </div>
      </div>

      {/* Target band */}
      {t && (
        <div className={`rounded-2xl border p-5 ${t.achieved ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {t.achieved ? <CheckCircle2 size={18} className="text-emerald-600" /> : <Target size={18} className="text-amber-600" />}
            <h3 className={`text-sm font-black ${t.achieved ? 'text-emerald-800' : 'text-amber-800'}`}>
              {t.achieved ? 'Target band reached' : `${t.gap} band${t.gap === 1 ? '' : 's'} below target`}
            </h3>
          </div>
          <Bullets items={t.primaryReasons} />
          {t.criteriaGaps?.length ? (
            <div className="mt-3 space-y-1.5">
              {t.criteriaGaps.map((g, i) => (
                <div key={i} className="text-sm text-slate-700">
                  <span className="font-bold">{g.criterion}:</span> {g.currentBand} → {g.targetApprox} — {g.whatToDo}
                </div>
              ))}
            </div>
          ) : null}
          {t.studyPriority && <p className="text-sm text-slate-700 mt-2"><span className="font-bold">Focus first:</span> {t.studyPriority}</p>}
          {t.realisticTimeline && <p className="text-sm text-slate-700"><span className="font-bold">Timeline:</span> {t.realisticTimeline}</p>}
        </div>
      )}

      {/* Four criteria */}
      <div>
        <SectionTitle>The four criteria</SectionTitle>
        <div className="space-y-4">
          {result.criteria.map(c => <CriterionCard key={c.code} c={c} />)}
        </div>
      </div>

      {/* Major errors */}
      {result.majorErrors?.length ? (
        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={18} className="text-red-600" />
            <h3 className="text-sm font-black text-red-800">What held the band back</h3>
          </div>
          <Bullets items={result.majorErrors} tone="red" />
        </div>
      ) : null}

      {/* Improvement advice */}
      {result.bandImprovementAdvice?.length ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <SectionTitle>Reach the next band</SectionTitle>
          <ol className="space-y-2">
            {result.bandImprovementAdvice.map((a, i) => (
              <li key={i} className="flex gap-3 text-sm text-slate-700 leading-relaxed">
                <span className="flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black shrink-0" style={{ backgroundColor: CRIMSON }}>{i + 1}</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      {/* Band 9 suggestions */}
      {result.band9Suggestions && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight size={18} style={{ color: CRIMSON }} />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">Toward Band 9</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {([
              ['Vocabulary', result.band9Suggestions.vocabulary],
              ['Grammar', result.band9Suggestions.grammar],
              ['Idea development', result.band9Suggestions.ideaDevelopment],
              ['Organization', result.band9Suggestions.organization],
            ] as const).map(([label, val]) => val ? (
              <div key={label}>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 mb-1">{label}</p>
                <p className="text-sm text-slate-700 leading-relaxed">{val}</p>
              </div>
            ) : null)}
          </div>
        </div>
      )}
    </div>
  );
}
