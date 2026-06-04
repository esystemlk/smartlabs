// Shared PTE essay scoring types — used by the essay practice page, the
// EssayResultDetails component, the tutor page, and the essay-session service.

export interface Criterion {
  name: string;
  score: number;
  max: number;
  color: string;
  comment: string;
}

export interface VocabUpgrade {
  basic: string;
  better: string;
}

export interface StructureDetail {
  paragraphCount: number;
  paragraphCountCorrect: boolean;
  introduction: string;
  bodyParagraph1: string;
  bodyParagraph2: string;
  conclusion: string;
  overallBalance: string;
  followsIdealStrategy: boolean;
}

export interface CoherenceAnalysis {
  oneIdeaPerParagraph: boolean;
  logicalFlow: string;
  paragraphUnity: string;
  sentenceConnection: string;
  transitionQuality: string;
  breakPoints: string[];
}

export interface ThesisDevelopment {
  clarityOfThesis: string;
  consistencyOfArguments: string;
  bodySupportsThesis: boolean;
  conclusionProvesThesis: boolean;
  overallAnalysis: string;
}

export interface ArgumentativeQuality {
  explanationDepth: string;
  logicQuality: string;
  exampleSupport: string;
  relevanceOfIdeas: string;
  criticalThinking: string;
  weakArguments: string[];
  howToImprove: string[];
}

export interface VocabCollocations {
  strongVocabulary: string[];
  collocationsUsed: { collocation: string; evaluation: string }[];
  repetitiveVocabulary: string[];
  impreciseWords: string[];
  awkwardPhrases: string[];
  memorizedLanguage: string[];
}

export interface GrammarDetail {
  mistakes: { original: string; corrected: string; explanation: string }[];
  punctuationMistakes: string[];
  awkwardSentences: string[];
  sentenceVariety: string;
}

export interface ImprovementPlan {
  top5Weaknesses: string[];
  sentenceCorrections: { original: string; improved: string }[];
  strategicTips: string[];
}

export interface TargetScoreAnalysis {
  achieved: boolean;
  gap: number;
  primaryReasons: string[];
  criteriaGaps: { criterion: string; currentScore: number; targetApprox: number; whatToDo: string }[];
  studyPriority: string;
  realisticTimeline: string;
}

export interface AIResponse {
  overallBand: number;
  bandLabel: string;
  summaryTitle: string;
  summaryText: string;
  criteria: Criterion[];
  strengths: string[];
  improvements: string[];
  structureAnalysis?: string;
  modelEssay: string;
  reviewedEssayHtml: string;
  actionableFeedback?: { issue: string; howToFix: string }[];
  vocabUpgrades: VocabUpgrade[];
  _metadata?: { modelUsed: string };
  contentAnalysis?: { score: number; reason: string };
  structureDetail?: StructureDetail;
  coherenceAnalysis?: CoherenceAnalysis;
  thesisDevelopment?: ThesisDevelopment;
  argumentativeQuality?: ArgumentativeQuality;
  vocabularyCollocations?: VocabCollocations;
  grammarAnalysis?: GrammarDetail;
  improvementPlan?: ImprovementPlan;
  wouldScore79Plus?: { answer: boolean; explanation: string };
  targetScoreAnalysis?: TargetScoreAnalysis | null;
}

// A persisted scoring session (Firestore: users/{uid}/essay_sessions/{id})
export interface EssaySession {
  id?: string;
  topic: string;
  topicId: number | null;
  essayText: string;
  wordCount: number;
  targetScore: number | null;
  result: AIResponse;
  createdAt?: unknown; // Firestore Timestamp on read, serverTimestamp() on write
}
