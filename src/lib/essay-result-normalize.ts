import type { AIResponse } from '@/types/essay';

// The AI sometimes returns an object where the page expects plain text — e.g. a vocabulary
// upgrade {basic, better} inside a text list. React cannot render an object as text and the
// whole result page crashes (minified React error #31). Every list below must hold text, so
// any object in it is turned into readable text. Used on the server before a result is saved
// and on the page before one is shown (results saved earlier may still have the bad shape).

const TEXT_LISTS = [
  'strengths', 'improvements',
  'structureDetail.breakPoints', 'coherenceAnalysis.breakPoints',
  'argumentativeQuality.weakArguments', 'argumentativeQuality.howToImprove',
  'vocabularyCollocations.strongVocabulary', 'vocabularyCollocations.repetitiveVocabulary',
  'vocabularyCollocations.impreciseWords', 'vocabularyCollocations.awkwardPhrases', 'vocabularyCollocations.memorizedLanguage',
  'grammarAnalysis.punctuationMistakes', 'grammarAnalysis.awkwardSentences',
  'improvementPlan.top5Weaknesses', 'improvementPlan.strategicTips',
  'targetScoreAnalysis.primaryReasons',
] as const;

/** Any value as display text: {basic, better} → "basic → better"; other objects → their text parts. */
export function asText(v: unknown): string {
  if (v == null) return '';
  if (typeof v !== 'object') return String(v);
  if (Array.isArray(v)) return v.map(asText).filter(Boolean).join('; ');
  const o = v as Record<string, unknown>;
  if ('basic' in o && 'better' in o) return `${asText(o.basic)} → ${asText(o.better)}`;
  if ('original' in o && ('improved' in o || 'corrected' in o)) return `${asText(o.original)} → ${asText(o.improved ?? o.corrected)}`;
  return Object.values(o).map(asText).filter(Boolean).join(' — ');
}

export function normalizeEssayResult<T extends Partial<AIResponse> | null | undefined>(r: T): T {
  if (!r || typeof r !== 'object') return r;
  const out = { ...r } as Record<string, unknown>;
  for (const path of TEXT_LISTS) {
    const [a, b] = path.split('.');
    const parent = b ? out[a] : out;
    const key = b ?? a;
    if (!parent || typeof parent !== 'object') continue;
    const list = (parent as Record<string, unknown>)[key];
    if (!Array.isArray(list)) continue;
    const fixed = list.map(x => (typeof x === 'string' ? x : asText(x))).filter(Boolean);
    if (b) out[a] = { ...(parent as object), [key]: fixed };
    else out[key] = fixed;
  }
  // vocabUpgrades must be {basic, better} objects; plain strings become {basic, better: ''}.
  if (Array.isArray(out.vocabUpgrades)) {
    out.vocabUpgrades = (out.vocabUpgrades as unknown[]).map(x =>
      x && typeof x === 'object' ? { basic: asText((x as Record<string, unknown>).basic), better: asText((x as Record<string, unknown>).better) } : { basic: asText(x), better: '' });
  }
  for (const k of ['summaryTitle', 'summaryText', 'structureAnalysis'] as const) if (out[k] != null && typeof out[k] !== 'string') out[k] = asText(out[k]);
  return out as T;
}

// IELTS Writing results (Task 1 and Task 2, also used by the IELTS mock): same protection.
const IELTS_CRITERION_LISTS = ['strengths', 'weaknesses', 'evidence', 'goodVocabulary', 'vocabularyErrors', 'collocationErrors', 'spellingErrors', 'sentenceStructureErrors', 'grammarErrors', 'punctuationErrors'];
const textList = (v: unknown) => (Array.isArray(v) ? v.map(x => (typeof x === 'string' ? x : asText(x))).filter(Boolean) : v);

export function normalizeIeltsResult<T>(r: T): T {
  if (!r || typeof r !== 'object') return r;
  const out = { ...(r as Record<string, unknown>) };
  if (Array.isArray(out.criteria)) {
    out.criteria = (out.criteria as Record<string, unknown>[]).map(c => {
      const cc = { ...c };
      for (const k of IELTS_CRITERION_LISTS) if (k in cc) cc[k] = textList(cc[k]);
      for (const k of ['reason', 'name']) if (cc[k] != null && typeof cc[k] !== 'string') cc[k] = asText(cc[k]);
      return cc;
    });
  }
  for (const k of ['majorErrors', 'bandImprovementAdvice']) if (k in out) out[k] = textList(out[k]);
  if (out.overallExplanation != null && typeof out.overallExplanation !== 'string') out.overallExplanation = asText(out.overallExplanation);
  if (out.band9Suggestions && typeof out.band9Suggestions === 'object') {
    out.band9Suggestions = Object.fromEntries(Object.entries(out.band9Suggestions as Record<string, unknown>).map(([k, v]) => [k, typeof v === 'string' ? v : asText(v)]));
  }
  const tba = out.targetBandAnalysis as Record<string, unknown> | null | undefined;
  if (tba && typeof tba === 'object') out.targetBandAnalysis = { ...tba, primaryReasons: textList(tba.primaryReasons) };
  return out as T;
}
