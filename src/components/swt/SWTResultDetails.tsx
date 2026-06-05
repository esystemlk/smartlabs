'use client';

import React from 'react';

/* Result shape returned by /api/score-swt */
export interface SWTResult {
  scores: { content: number; form: number; grammar: number; vocabulary: number };
  total: number;
  maxTotal: number;
  wordCount: number;
  formReasons?: string[];
  summaryTitle?: string;
  summaryText?: string;
  mainTopic?: string;
  mainIdeas?: string[];
  supportingIdeas?: string[];
  detailsToOmit?: string[];
  sentenceSelection?: { sentence: string; decision: 'pick' | 'skip'; importance: string; reason: string }[];
  strengths?: string[];
  missingIdeas?: string[];
  grammarCorrections?: { error: string; correction: string; rule: string }[];
  vocabSpellingCorrections?: { incorrect: string; correct: string; explanation: string }[];
  connectorCoaching?: string;
  examStrategy?: string;
  modelAnswer?: string;
  modelAnswerWhy?: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className="w-5 h-0.5 rounded bg-violet-500" />
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  );
}
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${className}`}>{children}</div>;
}
function Bullets({ items, tone = 'slate', symbol = '•' }: { items?: string[]; tone?: 'slate' | 'green' | 'red' | 'violet'; symbol?: string }) {
  if (!items || items.length === 0) return null;
  const c: Record<string, string> = { slate: 'text-slate-400', green: 'text-emerald-500', red: 'text-red-500', violet: 'text-violet-500' };
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
      <div className="text-2xl font-black text-violet-600">{value}<span className="text-sm text-slate-400">/{max}</span></div>
      <div className="text-[10px] font-black uppercase tracking-wider text-slate-500 mt-0.5">{label}</div>
    </div>
  );
}

export function SWTResultDetails({ result }: { result: SWTResult }) {
  const s = result.scores;
  const pct = result.maxTotal ? Math.round((result.total / result.maxTotal) * 100) : 0;

  return (
    <div className="space-y-8">
      {/* Score header */}
      <div className="grid sm:grid-cols-3 gap-5 items-center bg-violet-50 p-5 rounded-3xl border border-violet-200">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-violet-500 flex flex-col items-center justify-center bg-white shadow-[0_0_24px_rgba(139,92,246,0.18)]">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">SWT Score</span>
            <span className="text-4xl font-black text-violet-600 my-0.5">{result.total}</span>
            <span className="text-slate-400 text-[9px] font-bold">/ {result.maxTotal}</span>
          </div>
          <span className="mt-3 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-[11px] font-black uppercase border border-violet-200">{pct}%</span>
        </div>
        <div className="sm:col-span-2 space-y-3">
          {result.summaryTitle && <h3 className="text-xl font-black text-slate-900">{result.summaryTitle}</h3>}
          {result.summaryText && <p className="text-slate-600 text-sm leading-relaxed">{result.summaryText}</p>}
          <div className="grid grid-cols-4 gap-2">
            <ScorePill label="Content" value={s.content} max={4} />
            <ScorePill label="Form" value={s.form} max={1} />
            <ScorePill label="Grammar" value={s.grammar} max={2} />
            <ScorePill label="Vocab" value={s.vocabulary} max={2} />
          </div>
          {result.formReasons && result.formReasons.length > 0 && (
            <p className="text-xs text-slate-500">
              <span className="font-bold">Form:</span> {result.formReasons.join(' ')} ({result.wordCount} words)
            </p>
          )}
        </div>
      </div>

      {/* Main topic */}
      {result.mainTopic && (
        <Section title="Main Topic"><Card><p className="text-sm text-slate-700 leading-relaxed">{result.mainTopic}</p></Card></Section>
      )}

      {/* Ideas grid */}
      {(result.mainIdeas?.length || result.supportingIdeas?.length || result.detailsToOmit?.length) ? (
        <div className="grid md:grid-cols-3 gap-4">
          {result.mainIdeas && result.mainIdeas.length > 0 && (
            <div><Section title="Main Ideas"><Card><Bullets items={result.mainIdeas} tone="violet" symbol="✦" /></Card></Section></div>
          )}
          {result.supportingIdeas && result.supportingIdeas.length > 0 && (
            <div><Section title="Supporting Ideas"><Card><Bullets items={result.supportingIdeas} tone="slate" /></Card></Section></div>
          )}
          {result.detailsToOmit && result.detailsToOmit.length > 0 && (
            <div><Section title="Leave These Out"><Card><Bullets items={result.detailsToOmit} tone="red" symbol="✕" /></Card></Section></div>
          )}
        </div>
      ) : null}

      {/* Sentence selection */}
      {result.sentenceSelection && result.sentenceSelection.length > 0 && (
        <Section title="Sentence Selection Analysis">
          <div className="space-y-2">
            {result.sentenceSelection.map((x, i) => {
              const pick = x.decision === 'pick';
              return (
                <div key={i} className={`rounded-2xl border p-3 ${pick ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${pick ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {pick ? '✅ Pick' : '❌ Skip'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-500">{x.importance}</span>
                  </div>
                  <p className="text-sm text-slate-800 italic mb-1">"{x.sentence}"</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{x.reason}</p>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Strengths & missing */}
      {(result.strengths?.length || result.missingIdeas?.length) ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.strengths && result.strengths.length > 0 && (
            <div><Section title="Strengths"><Card><Bullets items={result.strengths} tone="green" symbol="+" /></Card></Section></div>
          )}
          {result.missingIdeas && result.missingIdeas.length > 0 && (
            <div><Section title="Missing Important Ideas"><Card><Bullets items={result.missingIdeas} tone="red" symbol="–" /></Card></Section></div>
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

      {/* Vocab & spelling */}
      {result.vocabSpellingCorrections && result.vocabSpellingCorrections.length > 0 && (
        <Section title="Vocabulary & Spelling">
          <div className="space-y-2">
            {result.vocabSpellingCorrections.map((v, i) => (
              <Card key={i}>
                <p className="text-sm"><span className="text-red-600 font-semibold">{v.incorrect}</span> <span className="text-slate-400">→</span> <span className="text-emerald-700 font-bold">{v.correct}</span></p>
                <p className="text-xs text-slate-500 mt-1">{v.explanation}</p>
              </Card>
            ))}
          </div>
        </Section>
      )}

      {/* Connector coaching */}
      {result.connectorCoaching && (
        <Section title="Connector & Comma Coaching"><Card><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.connectorCoaching}</p></Card></Section>
      )}

      {/* Exam strategy */}
      {result.examStrategy && (
        <Section title="Exam Strategy Advice"><Card className="bg-violet-50/60 border-violet-200"><p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{result.examStrategy}</p></Card></Section>
      )}

      {/* Model answer */}
      {result.modelAnswer && (
        <Section title="Model Full-Score Summary">
          <Card className="bg-emerald-50/50 border-emerald-200">
            <p className="text-sm text-slate-900 font-semibold italic leading-relaxed">"{result.modelAnswer}"</p>
            {result.modelAnswerWhy && <p className="text-xs text-slate-600 mt-2 leading-relaxed">{result.modelAnswerWhy}</p>}
          </Card>
        </Section>
      )}
    </div>
  );
}
