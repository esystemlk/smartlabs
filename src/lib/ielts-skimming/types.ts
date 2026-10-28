/**
 * Skimming Mastery Challenge — shared types.
 *
 * The FULL types (with `correct`, feedback, trick) are server-only data; the
 * student-facing API returns the Public* shapes, which never include answer
 * keys or feedback until a step is submitted.
 */

export interface SkimPassagePara {
  label: string; // "A", "B", …
  text: string;
}

export interface SkimQuestion {
  id: string;                              // e.g. "SKIM-01-Q01"
  prompt: string;
  options: string[];                       // option texts, index 0..n
  correct: number;                         // index of the correct option — SERVER ONLY
  teacherExplanation: string;              // shown after submit
  revealTrick: string;                     // shown via "Reveal the Trick" (after submit)
  wrongReasons: Record<string, string>;    // optionIndex -> why that distractor is wrong
}

export interface SkimStep {
  id: string;                              // "SKIM-01"
  title: string;                           // "How Community Gardens Changed"
  level: string;                           // "Foundation · clear main ideas"
  objective: string;                       // learning objective line
  passage: SkimPassagePara[];
  questions: SkimQuestion[];
}

export interface SkimContent {
  version: string;                         // content edition, e.g. "v1"
  steps: SkimStep[];                       // ordered SKIM-01..05
  updatedAt?: number;
  updatedBy?: string;
}

/** Pass threshold for a step = ceiling(0.8 × question count). */
export const passThreshold = (questionCount: number): number => Math.ceil(0.8 * questionCount);

// ── Student-facing (answer keys stripped) ──────────────────────────────────
export interface PublicSkimQuestion {
  id: string;
  prompt: string;
  options: string[];
}
export interface PublicSkimStep {
  id: string;
  title: string;
  level: string;
  objective: string;
  passage: SkimPassagePara[];
  questions: PublicSkimQuestion[];
  passMark: number;   // precomputed ceiling(0.8 × count)
  total: number;
}

export type StepState = 'locked' | 'ready' | 'in_progress' | 'passed';

/** Per-step progress stored under users/{uid}/skimming/{version}. */
export interface SkimStepProgress {
  passed: boolean;
  firstScore: number | null;
  bestScore: number | null;
  latestScore: number | null;
  attempts: number;
}

export interface SkimProgress {
  version: string;
  steps: Record<string, SkimStepProgress>;  // stepId -> progress
  badgeAwarded: boolean;
  badgeAt: number | null;
  updatedAt: number;
}

/** One graded question result returned after a submit. */
export interface SkimQuestionResult {
  id: string;
  selected: number | null;
  correct: number;
  isCorrect: boolean;
  teacherExplanation: string;
  revealTrick: string;
  wrongReason: string | null; // reason for the student's wrong option, if any
}
