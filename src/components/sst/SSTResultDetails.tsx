'use client';

import React from 'react';

/* Result shape returned by /api/score-sst */
export interface SSTResult {
  scores: { content: number; form: number; grammar: number; vocabulary: number; spelling: number };
  total: number;
  maxTotal: number;
  band: number;
  wordCount: number;
  spellingMistakeCount?: number;
  formReasons?: string[];
  summaryTitle?: string;
  summaryText?: string;
  mainTopic?: string;
  essentialKeywordsPresent?: string[];
  essentialKeywordsMissing?: string[];
  mainIdeasCovered?: string[];
  mainIdeasMissing?: string[];
  logicCheck?: { level: string; explanation: string };
  keywordPrecisionFlag?: string;
  spellingIssues?: { incorrect: string; correct: string; affectedKeyword: boolean; note: string }[];
  grammarCorrections?: { error: string; correction: string; rule: string }[];
  vocabNotes?: string[];
  strengths?: string[];
  improvements?: string[];
  finalJustification?: string;
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
function Bullets({ items, tone = 'slate', symbol = '•' }: { items?: string[]; tone?: 'slate' | 'green' | 'red' | 'emerald'; symbol?: string }) {
  if (!items || items.length === 0) return null;
  const c: Record<string, string> = { slate: 'text-slate-400', green: 'text-emerald-500', red: 'text-red-500', emerald: 'text-emerald-500' };
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
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 text-center shadow-sm">
      <div className="text-2xl font-black text-emerald-600">{value}<span className="text-sm text-slate-400">/{max}</span></div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function SSTResultDetails({ result }: { result: SSTResult }) {
  const s = result.scores;
  const pct = result.maxTotal ? Math.round((result.total / result.maxTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Score header */}
      <div className="grid sm:grid-cols-3 gap-5 items-center bg-emerald-50 p-5 rounded-3xl border border-emerald-200">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-emerald-500 flex flex-col items-center justify-center bg-white shadow-[0_0_24px_rgba(16,185,129,0.18)]">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Band</span>
            <span className="text-4xl font-black text-emerald-600 my-0.5">{result.band}</span>
            <span className="text-slate-400 text-[9px] font-bold">{result.total} / {result.maxTotal} marks</span>
          </div>
          <span className="mt-3 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-black uppercase border border-emerald-200">{pct}%</span>
        </div>
        <div className="sm:col-span-2 space-y-3">
          {result.summaryTitle && <h3 className="text-xl font-black text-slate-900">{result.summaryTitle}</h3>}
          {result.summaryText && <p className="text-slate-600 text-sm leading-relaxed">{result.summaryText}</p>}
          <div className="grid grid-cols-5 gap-2">
            <ScorePill label="Content" value={s.content} max={4} />
            <ScorePill label="Form" value={s.form} max={2} />
            <ScorePill label="Grammar" value={s.grammar} max={2} />
            <ScorePill label="Vocab" value={s.vocabulary} max={2} />
            <ScorePill label="Spelling" value={s.spelling} max={2} />
          </div>
          {result.formReasons && result.formReasons.length > 0 && (
            <p className="text-xs text-slate-500">
              <span className="font-bold">Form:</span> {result.formReasons.join(' ')} ({result.wordCount} words)
            </p>
          )}
        </div>
      </div>

      {/* Keyword-precision warning */}
      {result.keywordPrecisionFlag && result.keywordPrecisionFlag.trim().length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
          <span className="text-amber-500 font-black">⚠</span>
          <p className="text-sm text-amber-800 leading-relaxed font-medium">{result.keywordPrecisionFlag}</p>
        </div>
      )}

      {/* Main topic */}
      {result.mainTopic && (
        <Section title="Main Topic"><Card><p className="text-sm text-slate-700 leading-relaxed">{result.mainTopic}</p></Card></Section>
      )}

      {/* Essential keywords */}
      {(result.essentialKeywordsPresent?.length || result.essentialKeywordsMissing?.length) ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.essentialKeywordsPresent && result.essentialKeywordsPresent.length > 0 && (
            <div><Section title="Essential Keywords — Present"><Card><Bullets items={result.essentialKeywordsPresent} tone="green" symbol="✓" /></Card></Section></div>
          )}
          {result.essentialKeywordsMissing && result.essentialKeywordsMissing.length > 0 && (
            <div><Section title="Essential Keywords — Missing"><Card><Bullets items={result.essentialKeywordsMissing} tone="red" symbol="✕" /></Card></Section></div>
          )}
        </div>
      ) : null}

      {/* Main ideas */}
      {(result.mainIdeasCovered?.length || result.mainIdeasMissing?.length) ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.mainIdeasCovered && result.mainIdeasCovered.length > 0 && (
            <div><Section title="Main Ideas Covered"><Card><Bullets items={result.mainIdeasCovered} tone="green" symbol="✓" /></Card></Section></div>
          )}
          {result.mainIdeasMissing && result.mainIdeasMissing.length > 0 && (
            <div><Section title="Main Ideas Missing"><Card><Bullets items={result.mainIdeasMissing} tone="red" symbol="–" /></Card></Section></div>
          )}
        </div>
      ) : null}

      {/* Logic check */}
      {result.logicCheck && result.logicCheck.level && (
        <Section title="Logic Check">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <p className="text-sm font-black text-emerald-700 mb-1">{result.logicCheck.level}</p>
            <p className="text-sm text-slate-700 leading-relaxed">{result.logicCheck.explanation}</p>
          </Card>
        </Section>
      )}

      {/* Strengths & improvements */}
      {(result.strengths?.length || result.improvements?.length) ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.strengths && result.strengths.length > 0 && (
            <div><Section title="Strengths"><Card><Bullets items={result.strengths} tone="green" symbol="+" /></Card></Section></div>
          )}
          {result.improvements && result.improvements.length > 0 && (
            <div><Section title="How to Improve"><Card><Bullets items={result.improvements} tone="emerald" symbol="→" /></Card></Section></div>
          )}
        </div>
      ) : null}

      {/* Grammar corrections */}
      {result.grammarCorrections && result.grammarCorrections.length > 0 && (
        <Section title="Grammar Corrections">
          <div className="space-y-2">
            {result.grammarCorrections.map((g, i) => (
              <Card key={i}>
                <p className="text-sm text-red-600 line-through">{g.error}</p>
                <p className="text-sm text-emerald-700 font-semibold">{g.correction}</p>
                <p className="text-xs text-slate-500 mt-1">{g.rule}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Vocabulary notes */}
      {result.vocabNotes && result.vocabNotes.length > 0 && (
        <Section title="Vocabulary"><Card><Bullets items={result.vocabNotes} tone="slate" /></Card></Section>
      )}

      {/* Spelling issues */}
      {result.spellingIssues && result.spellingIssues.length > 0 && (
        <Section title={`Spelling Issues (${result.spellingMistakeCount ?? result.spellingIssues.length})`}>
          <div className="space-y-2">
            {result.spellingIssues.map((v, i) => (
              <Card key={i}>
                <p className="text-sm"><span className="text-red-600 font-semibold line-through">{v.incorrect}</span> <span className="text-slate-400">→</span> <span className="text-emerald-700 font-bold">{v.correct}</span>
                  {v.affectedKeyword && <span className="ml-2 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200">keyword lost</span>}
                </p>
                {v.note && <p className="text-xs text-slate-500 mt-1">{v.note}</p>}
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Final justification */}
      {result.finalJustification && (
        <Section title="Examiner's Justification"><Card className="bg-slate-50 border-slate-200"><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.finalJustification}</p></Card></Section>
      )}

      {/* Model answer */}
      {result.modelAnswer && (
        <Section title="Model High-Score Summary">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <p className="text-sm text-slate-900 font-semibold italic leading-relaxed">"{result.modelAnswer}"</p>
            {result.modelAnswerWhy && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{result.modelAnswerWhy}</p>}
          </Card>
        </Section>
      )}
    </div>
  );
}
