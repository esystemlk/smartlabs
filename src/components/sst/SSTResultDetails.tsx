'use client';

import React from 'react';

/* Result shape returned by /api/score-sst */
export interface SSTResult {
  scores: { content: number; grammar: number; vocabulary: number; spelling: number; form: number };
  total: number;
  maxTotal: number;
  band: number;
  wordCount: number;
  formReason?: string;
  grammarMistakes?: { error: string; correction: string; rule: string }[];
  spellingMistakes?: { incorrect: string; correct: string }[];
  grammarMistakeCount?: number;
  spellingMistakeCount?: number;
  vocabBase?: number;
  vocabSpellingPenalty?: number;
  summaryTitle?: string;
  summaryText?: string;
  mainTopic?: string;
  keyIdeasCovered?: string[];
  missingKeyIdeas?: string[];
  weakKeywords?: string[];
  vocabularyWeaknesses?: string[];
  strengths?: string[];
  suggestedImprovements?: string[];
  contentJustification?: string;
  modelAnswer?: string;
  modelAnswerWhy?: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-0.5 rounded bg-emerald-500" />
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${className}`}>{children}</div>;
}
function Bullets({ items, tone = 'slate', symbol = '•' }: { items?: string[]; tone?: 'slate' | 'green' | 'red' | 'amber' | 'emerald'; symbol?: string }) {
  if (!items || items.length === 0) return null;
  const c: Record<string, string> = { slate: 'text-slate-400', green: 'text-emerald-500', red: 'text-red-500', amber: 'text-amber-500', emerald: 'text-emerald-500' };
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
          <span className={`shrink-0 font-bold ${c[tone]}`}>{symbol}</span><span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

function ScorePill({ label, value, max }: { label: string; value: number; max: number }) {
  const full = value === max;
  const zero = value === 0;
  return (
    <div className={`rounded-2xl border p-3 text-center shadow-sm ${full ? 'bg-emerald-50 border-emerald-200' : zero ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
      <div className={`text-2xl font-black ${full ? 'text-emerald-600' : zero ? 'text-red-500' : 'text-slate-700'}`}>
        {value}<span className="text-sm text-slate-400">/{max}</span>
      </div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function SSTResultDetails({ result }: { result: SSTResult }) {
  const s = result.scores;
  const formOk = s.form === 2;

  return (
    <div className="space-y-8">
      {/* ── OVERALL SCORE ── */}
      <div className="grid sm:grid-cols-3 gap-5 items-center bg-emerald-50 p-5 rounded-3xl border border-emerald-200">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center bg-white shadow-[0_0_24px_rgba(16,185,129,0.18)]">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Total</span>
            <span className="text-4xl font-black text-emerald-600 my-0.5">{result.total}</span>
            <span className="text-slate-400 text-[10px] font-bold">/ {result.maxTotal}</span>
          </div>
          <span className="mt-3 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase border border-emerald-200">
            Band ≈ {result.band}
          </span>
        </div>
        <div className="sm:col-span-2 space-y-3">
          {result.summaryTitle && <h3 className="text-xl font-black text-slate-900">{result.summaryTitle}</h3>}
          {result.summaryText && <p className="text-slate-600 text-sm leading-relaxed">{result.summaryText}</p>}
          <div className="grid grid-cols-5 gap-2">
            <ScorePill label="Content" value={s.content} max={4} />
            <ScorePill label="Grammar" value={s.grammar} max={2} />
            <ScorePill label="Vocab" value={s.vocabulary} max={2} />
            <ScorePill label="Spelling" value={s.spelling} max={2} />
            <ScorePill label="Form" value={s.form} max={2} />
          </div>
          {result.formReason && (
            <p className={`text-xs ${formOk ? 'text-slate-500' : 'text-red-600 font-semibold'}`}>
              <span className="font-bold">Form:</span> {result.formReason}
            </p>
          )}
          {!!result.vocabSpellingPenalty && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              Vocabulary reduced by {result.vocabSpellingPenalty} — spelling mistakes affected word recognition
              {result.vocabBase !== undefined && ` (base ${result.vocabBase} → ${s.vocabulary})`}.
            </p>
          )}
        </div>
      </div>

      {/* Main topic */}
      {result.mainTopic && (
        <Section title="Main Topic of the Lecture">
          <Card><p className="text-sm text-slate-700 leading-relaxed">{result.mainTopic}</p></Card>
        </Section>
      )}

      {/* ── STRENGTHS ── */}
      {result.strengths && result.strengths.length > 0 && (
        <Section title="Strengths">
          <Card className="bg-emerald-50/50 border-emerald-200"><Bullets items={result.strengths} tone="green" symbol="+" /></Card>
        </Section>
      )}

      {/* ── MISTAKES ── */}
      <Section title="Mistakes">
        <div className="space-y-4">
          {/* Grammar */}
          <Card>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Grammar mistakes ({result.grammarMistakeCount ?? 0}) — {s.grammar}/2
            </p>
            {result.grammarMistakes && result.grammarMistakes.length > 0 ? (
              <div className="space-y-2">
                {result.grammarMistakes.map((g, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                    <p className="text-sm text-red-600 line-through">{g.error}</p>
                    <p className="text-sm text-emerald-700 font-semibold">{g.correction}</p>
                    <p className="text-xs text-slate-500 mt-1">{g.rule}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-600 font-semibold">No grammar mistakes found.</p>
            )}
          </Card>

          {/* Spelling */}
          <Card>
            <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
              Spelling mistakes ({result.spellingMistakeCount ?? 0}) — {s.spelling}/2
            </p>
            {result.spellingMistakes && result.spellingMistakes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {result.spellingMistakes.map((v, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
                    <span className="text-red-600 font-semibold line-through">{v.incorrect}</span>
                    <span className="text-slate-400">→</span>
                    <span className="text-emerald-700 font-bold">{v.correct}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-emerald-600 font-semibold">No spelling mistakes found.</p>
            )}
          </Card>

          {/* Vocabulary weaknesses */}
          {result.vocabularyWeaknesses && result.vocabularyWeaknesses.length > 0 && (
            <Card>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Vocabulary weaknesses</p>
              <Bullets items={result.vocabularyWeaknesses} tone="amber" symbol="!" />
            </Card>
          )}

          {/* Missing key ideas */}
          {result.missingKeyIdeas && result.missingKeyIdeas.length > 0 && (
            <Card>
              <p className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">Missing key ideas</p>
              <Bullets items={result.missingKeyIdeas} tone="red" symbol="–" />
            </Card>
          )}

          {/* Weak / generic keywords */}
          {result.weakKeywords && result.weakKeywords.length > 0 && (
            <Card className="bg-amber-50/60 border-amber-200">
              <p className="text-xs font-black uppercase tracking-wider text-amber-800 mb-2">Isolated or overly general keywords</p>
              <p className="text-xs text-amber-800 mb-2 leading-relaxed">
                These earn no credit on their own — a keyword must express a full idea from the lecture
                (e.g. &ldquo;protecting biodiversity&rdquo;, not just &ldquo;biodiversity&rdquo;).
              </p>
              <div className="flex flex-wrap gap-2">
                {result.weakKeywords.map((k, i) => (
                  <span key={i} className="text-xs font-bold bg-white text-amber-700 border border-amber-200 rounded-full px-2.5 py-1">{k}</span>
                ))}
              </div>
            </Card>
          )}
        </div>
      </Section>

      {/* Key ideas captured */}
      {result.keyIdeasCovered && result.keyIdeasCovered.length > 0 && (
        <Section title="Key Ideas You Captured">
          <Card><Bullets items={result.keyIdeasCovered} tone="green" symbol="✓" /></Card>
        </Section>
      )}

      {/* ── SUGGESTED IMPROVEMENTS ── */}
      {result.suggestedImprovements && result.suggestedImprovements.length > 0 && (
        <Section title="Suggested Improvements">
          <Card className="bg-slate-50 border-slate-200"><Bullets items={result.suggestedImprovements} tone="emerald" symbol="→" /></Card>
        </Section>
      )}

      {/* Content justification */}
      {result.contentJustification && (
        <Section title="Why You Got This Content Mark">
          <Card><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.contentJustification}</p></Card>
        </Section>
      )}

      {/* Model answer */}
      {result.modelAnswer && (
        <Section title="Model 50–70 Word Summary">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <p className="text-sm text-slate-900 font-semibold italic leading-relaxed">&ldquo;{result.modelAnswer}&rdquo;</p>
            {result.modelAnswerWhy && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{result.modelAnswerWhy}</p>}
          </Card>
        </Section>
      )}
    </div>
  );
}
