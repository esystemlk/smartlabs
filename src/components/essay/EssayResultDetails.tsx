'use client';

import React from 'react';
import { Markdown } from '@/components/ui/markdown';
import type { AIResponse } from '@/types/essay';

/**
 * Complete, read-only display of a PTE essay scoring result.
 * Renders EVERY field of AIResponse so nothing is missed — used on the AI Tutor page.
 */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="w-5 h-0.5 rounded bg-[#f97316]" />
      <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">{children}</h3>
    </div>
  );
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function KV({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-2 text-sm">
      <span className="font-bold text-slate-800 shrink-0 min-w-[120px]">{label}</span>
      <span className="text-slate-600 leading-relaxed">{value}</span>
    </div>
  );
}

function Chip({ children, tone = 'slate' }: { children: React.ReactNode; tone?: 'slate' | 'green' | 'amber' | 'red' | 'blue' }) {
  const tones: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600 border-slate-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
  };
  return <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${tones[tone]}`}>{children}</span>;
}

function YesNo({ ok, label }: { ok: boolean; label: string }) {
  return <Chip tone={ok ? 'green' : 'red'}>{label}: {ok ? 'Yes' : 'No'}</Chip>;
}

function Bullets({ items, tone = 'slate', symbol = '•' }: { items?: string[]; tone?: 'slate' | 'green' | 'amber' | 'red'; symbol?: string }) {
  if (!items || items.length === 0) return null;
  const color: Record<string, string> = { slate: 'text-slate-400', green: 'text-emerald-500', amber: 'text-amber-500', red: 'text-red-500' };
  return (
    <ul className="space-y-1.5">
      {items.map((it, i) => (
        <li key={i} className="flex gap-2 text-sm text-slate-700 leading-relaxed">
          <span className={`shrink-0 font-bold ${color[tone]}`}>{symbol}</span>
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}

export function EssayResultDetails({
  result,
  essayText,
  targetScore,
}: {
  result: AIResponse;
  essayText?: string;
  topic?: string;
  targetScore?: number | null;
}) {
  const wordCount = essayText ? essayText.trim().split(/\s+/).filter(Boolean).length : undefined;
  const tsa = result.targetScoreAnalysis;

  return (
    <div className="space-y-8">
      {/* ── Score header ── */}
      <div className="grid sm:grid-cols-3 gap-5 items-center bg-slate-50 p-5 rounded-3xl border border-slate-200">
        <div className="flex flex-col items-center justify-center">
          <div className="relative w-32 h-32 rounded-full border-4 border-[#f59e0b] flex flex-col items-center justify-center bg-white shadow-[0_0_24px_rgba(245,158,11,0.12)]">
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">PTE Band</span>
            <span className="text-4xl font-black text-[#f59e0b] my-0.5">{result.overallBand}</span>
            <span className="text-slate-400 text-[9px] font-bold">Max 90</span>
          </div>
          <span className="mt-3 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-black uppercase border border-amber-200">
            {result.bandLabel}
          </span>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <h3 className="text-xl font-black text-slate-900">{result.summaryTitle}</h3>
          <p className="text-slate-600 text-sm leading-relaxed">{result.summaryText}</p>
          {wordCount !== undefined && (
            <div className="pt-2 text-xs text-slate-500">
              Essay length: <strong className="text-slate-700">{wordCount} words</strong>
            </div>
          )}
        </div>
      </div>

      {/* ── Would score 79+ ── */}
      {result.wouldScore79Plus && (
        <Card className={result.wouldScore79Plus.answer ? 'border-emerald-200 bg-emerald-50/40' : 'border-orange-200 bg-orange-50/40'}>
          <p className={`text-sm font-black mb-1 ${result.wouldScore79Plus.answer ? 'text-emerald-700' : 'text-orange-700'}`}>
            {result.wouldScore79Plus.answer ? 'Would likely score 79+' : 'Not yet at 79+ level'}
          </p>
          <p className="text-sm text-slate-700 leading-relaxed">{result.wouldScore79Plus.explanation}</p>
        </Card>
      )}

      {/* ── Target score analysis ── */}
      {targetScore != null && tsa && (
        <div>
          <SectionTitle>Target Score Analysis · Band {targetScore}</SectionTitle>
          <Card className={tsa.achieved ? 'border-emerald-200 bg-emerald-50/40' : 'border-orange-200 bg-orange-50/40'}>
            <p className={`text-sm font-black mb-2 ${tsa.achieved ? 'text-emerald-700' : 'text-orange-700'}`}>
              {tsa.achieved ? `Band ${targetScore} target achieved` : `Band ${targetScore} not yet reached — gap of ${tsa.gap} pts`}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              <Chip>Target: {targetScore}</Chip>
              <Chip tone={tsa.achieved ? 'green' : 'red'}>Current: {result.overallBand}</Chip>
            </div>
            {tsa.primaryReasons?.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-orange-700 mb-1.5">Primary reasons</p>
                <Bullets items={tsa.primaryReasons} tone="red" symbol="–" />
              </div>
            )}
            {tsa.criteriaGaps?.length > 0 && (
              <div className="mb-3 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">Criteria to improve</p>
                {tsa.criteriaGaps.map((g, i) => (
                  <div key={i} className="bg-white rounded-xl border border-slate-200 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <span className="font-black text-sm text-slate-800">{g.criterion}</span>
                      <span className="text-xs font-bold">
                        <span className="text-red-600">Now {g.currentScore}</span> → <span className="text-emerald-600">Need {g.targetApprox}+</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{g.whatToDo}</p>
                  </div>
                ))}
              </div>
            )}
            <KV label="Top priority" value={tsa.studyPriority} />
            <KV label="Realistic timeline" value={tsa.realisticTimeline} />
          </Card>
        </div>
      )}

      {/* ── Scoring criteria ── */}
      {result.criteria?.length > 0 && (
        <div>
          <SectionTitle>Scoring Criteria</SectionTitle>
          <div className="grid sm:grid-cols-2 gap-3">
            {result.criteria.map((c, i) => (
              <Card key={i}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-black text-sm text-slate-800">{c.name}</span>
                  <span className="text-sm font-black px-2 py-0.5 rounded-lg" style={{ color: c.color, backgroundColor: `${c.color}1a` }}>
                    {c.score} / {c.max}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{c.comment}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Content analysis ── */}
      {result.contentAnalysis && (
        <div>
          <SectionTitle>Content Analysis</SectionTitle>
          <Card>
            <Chip tone="blue">Content score: {result.contentAnalysis.score} / 6</Chip>
            <p className="text-sm text-slate-700 leading-relaxed mt-2">{result.contentAnalysis.reason}</p>
          </Card>
        </div>
      )}

      {/* ── Structure ── */}
      {(result.structureDetail || result.structureAnalysis) && (
        <div>
          <SectionTitle>Structure Analysis</SectionTitle>
          <Card className="space-y-3">
            {result.structureAnalysis && <p className="text-sm text-slate-700 leading-relaxed">{result.structureAnalysis}</p>}
            {result.structureDetail && (
              <>
                <div className="flex flex-wrap gap-2">
                  <YesNo ok={result.structureDetail.paragraphCountCorrect} label="Paragraph count" />
                  <YesNo ok={result.structureDetail.followsIdealStrategy} label="Ideal strategy" />
                  <Chip>Paragraphs: {result.structureDetail.paragraphCount}</Chip>
                </div>
                <div className="space-y-1.5">
                  <KV label="Introduction" value={result.structureDetail.introduction} />
                  <KV label="Body paragraph 1" value={result.structureDetail.bodyParagraph1} />
                  <KV label="Body paragraph 2" value={result.structureDetail.bodyParagraph2} />
                  <KV label="Conclusion" value={result.structureDetail.conclusion} />
                  <KV label="Overall balance" value={result.structureDetail.overallBalance} />
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* ── Coherence ── */}
      {result.coherenceAnalysis && (
        <div>
          <SectionTitle>Coherence &amp; Cohesion</SectionTitle>
          <Card className="space-y-3">
            <YesNo ok={result.coherenceAnalysis.oneIdeaPerParagraph} label="One idea / paragraph" />
            <div className="space-y-1.5">
              <KV label="Logical flow" value={result.coherenceAnalysis.logicalFlow} />
              <KV label="Paragraph unity" value={result.coherenceAnalysis.paragraphUnity} />
              <KV label="Sentence connection" value={result.coherenceAnalysis.sentenceConnection} />
              <KV label="Transition quality" value={result.coherenceAnalysis.transitionQuality} />
            </div>
            {result.coherenceAnalysis.breakPoints?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Break points</p>
                <Bullets items={result.coherenceAnalysis.breakPoints} tone="red" symbol="!" />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Thesis development ── */}
      {result.thesisDevelopment && (
        <div>
          <SectionTitle>Thesis Development</SectionTitle>
          <Card className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <YesNo ok={result.thesisDevelopment.bodySupportsThesis} label="Body supports thesis" />
              <YesNo ok={result.thesisDevelopment.conclusionProvesThesis} label="Conclusion proves thesis" />
            </div>
            <div className="space-y-1.5">
              <KV label="Clarity of thesis" value={result.thesisDevelopment.clarityOfThesis} />
              <KV label="Consistency" value={result.thesisDevelopment.consistencyOfArguments} />
              <KV label="Overall" value={result.thesisDevelopment.overallAnalysis} />
            </div>
          </Card>
        </div>
      )}

      {/* ── Argumentative quality ── */}
      {result.argumentativeQuality && (
        <div>
          <SectionTitle>Argumentative Quality</SectionTitle>
          <Card className="space-y-3">
            <div className="space-y-1.5">
              <KV label="Explanation depth" value={result.argumentativeQuality.explanationDepth} />
              <KV label="Logic quality" value={result.argumentativeQuality.logicQuality} />
              <KV label="Example support" value={result.argumentativeQuality.exampleSupport} />
              <KV label="Relevance of ideas" value={result.argumentativeQuality.relevanceOfIdeas} />
              <KV label="Critical thinking" value={result.argumentativeQuality.criticalThinking} />
            </div>
            {result.argumentativeQuality.weakArguments?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-red-700 mb-1.5">Weak arguments</p>
                <Bullets items={result.argumentativeQuality.weakArguments} tone="red" symbol="–" />
              </div>
            )}
            {result.argumentativeQuality.howToImprove?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-1.5">How to improve</p>
                <Bullets items={result.argumentativeQuality.howToImprove} tone="green" symbol="+" />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Vocabulary & collocations ── */}
      {result.vocabularyCollocations && (
        <div>
          <SectionTitle>Vocabulary &amp; Collocations</SectionTitle>
          <Card className="space-y-3">
            {result.vocabularyCollocations.strongVocabulary?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-1.5">Strong vocabulary</p>
                <div className="flex flex-wrap gap-1.5">{result.vocabularyCollocations.strongVocabulary.map((w, i) => <Chip key={i} tone="green">{w}</Chip>)}</div>
              </div>
            )}
            {result.vocabularyCollocations.collocationsUsed?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Collocations used</p>
                <ul className="space-y-1.5">
                  {result.vocabularyCollocations.collocationsUsed.map((c, i) => (
                    <li key={i} className="text-sm text-slate-700"><strong>{c.collocation}</strong> — {c.evaluation}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.vocabularyCollocations.repetitiveVocabulary?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 mb-1.5">Repetitive words</p>
                <div className="flex flex-wrap gap-1.5">{result.vocabularyCollocations.repetitiveVocabulary.map((w, i) => <Chip key={i} tone="amber">{w}</Chip>)}</div>
              </div>
            )}
            {result.vocabularyCollocations.impreciseWords?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 mb-1.5">Imprecise words</p>
                <div className="flex flex-wrap gap-1.5">{result.vocabularyCollocations.impreciseWords.map((w, i) => <Chip key={i} tone="amber">{w}</Chip>)}</div>
              </div>
            )}
            {result.vocabularyCollocations.awkwardPhrases?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-red-700 mb-1.5">Awkward phrases</p>
                <Bullets items={result.vocabularyCollocations.awkwardPhrases} tone="red" symbol="!" />
              </div>
            )}
            {result.vocabularyCollocations.memorizedLanguage?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1.5">Memorized language</p>
                <div className="flex flex-wrap gap-1.5">{result.vocabularyCollocations.memorizedLanguage.map((w, i) => <Chip key={i}>{w}</Chip>)}</div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Grammar ── */}
      {result.grammarAnalysis && (
        <div>
          <SectionTitle>Grammar Analysis</SectionTitle>
          <Card className="space-y-3">
            <KV label="Sentence variety" value={result.grammarAnalysis.sentenceVariety} />
            {result.grammarAnalysis.mistakes?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">Grammar mistakes</p>
                {result.grammarAnalysis.mistakes.map((m, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                    <p className="text-sm text-red-600 line-through">{m.original}</p>
                    <p className="text-sm text-emerald-700 font-semibold">{m.corrected}</p>
                    <p className="text-xs text-slate-500 mt-1">{m.explanation}</p>
                  </div>
                ))}
              </div>
            )}
            {result.grammarAnalysis.punctuationMistakes?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-amber-700 mb-1.5">Punctuation</p>
                <Bullets items={result.grammarAnalysis.punctuationMistakes} tone="amber" symbol="–" />
              </div>
            )}
            {result.grammarAnalysis.awkwardSentences?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-red-700 mb-1.5">Awkward sentences</p>
                <Bullets items={result.grammarAnalysis.awkwardSentences} tone="red" symbol="!" />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Strengths & Improvements ── */}
      {(result.strengths?.length > 0 || result.improvements?.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          {result.strengths?.length > 0 && (
            <div>
              <SectionTitle>Strengths</SectionTitle>
              <Card><Bullets items={result.strengths} tone="green" symbol="+" /></Card>
            </div>
          )}
          {result.improvements?.length > 0 && (
            <div>
              <SectionTitle>Areas to Improve</SectionTitle>
              <Card><Bullets items={result.improvements} tone="red" symbol="–" /></Card>
            </div>
          )}
        </div>
      )}

      {/* ── Actionable feedback ── */}
      {result.actionableFeedback && result.actionableFeedback.length > 0 && (
        <div>
          <SectionTitle>Actionable Feedback</SectionTitle>
          <div className="space-y-2">
            {result.actionableFeedback.map((a, i) => (
              <Card key={i}>
                <p className="text-sm font-bold text-red-600 mb-0.5">Issue: {a.issue}</p>
                <p className="text-sm text-emerald-700">Fix: {a.howToFix}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Vocabulary upgrades ── */}
      {result.vocabUpgrades && result.vocabUpgrades.length > 0 && (
        <div>
          <SectionTitle>Vocabulary Upgrades</SectionTitle>
          <Card>
            <ul className="space-y-1.5">
              {result.vocabUpgrades.map((v, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-amber-700">{v.basic}</span>
                  <span className="text-slate-400">→</span>
                  <span className="text-emerald-700 font-bold">{v.better}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* ── Improvement plan ── */}
      {result.improvementPlan && (
        <div>
          <SectionTitle>Improvement Plan</SectionTitle>
          <Card className="space-y-3">
            {result.improvementPlan.top5Weaknesses?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-red-700 mb-1.5">Top weaknesses</p>
                <ol className="list-decimal list-inside space-y-1 text-sm text-slate-700">
                  {result.improvementPlan.top5Weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                </ol>
              </div>
            )}
            {result.improvementPlan.sentenceCorrections?.length > 0 && (
              <div className="space-y-2">
                <p className="text-[11px] font-black uppercase tracking-wider text-slate-600">Sentence corrections</p>
                {result.improvementPlan.sentenceCorrections.map((s, i) => (
                  <div key={i} className="bg-slate-50 rounded-xl border border-slate-200 p-3">
                    <p className="text-sm text-red-600 line-through">{s.original}</p>
                    <p className="text-sm text-emerald-700 font-semibold">{s.improved}</p>
                  </div>
                ))}
              </div>
            )}
            {result.improvementPlan.strategicTips?.length > 0 && (
              <div>
                <p className="text-[11px] font-black uppercase tracking-wider text-emerald-700 mb-1.5">Strategic tips</p>
                <Bullets items={result.improvementPlan.strategicTips} tone="green" symbol="•" />
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Model essay ── */}
      {result.modelEssay && result.modelEssay.trim().length > 0 && (
        <div>
          <SectionTitle>Model Essay (Band 85+)</SectionTitle>
          <Card>
            <Markdown content={result.modelEssay} />
          </Card>
        </div>
      )}

      {/* ── Reviewed essay (errors marked) ── */}
      {result.reviewedEssayHtml && result.reviewedEssayHtml.trim().length > 0 && (
        <div>
          <SectionTitle>Your Essay — Errors Marked</SectionTitle>
          <Card>
            <div
              className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: result.reviewedEssayHtml }}
            />
          </Card>
        </div>
      )}
    </div>
  );
}
