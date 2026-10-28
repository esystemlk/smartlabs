/**
 * Skimming Mastery — server-only service: loads the published content from
 * Firestore (falling back to the committed seed), strips answer keys for the
 * student, grades a step, and derives step lock state. Importing this pulls in
 * the answer keys, so it must never be used from a client component.
 */
import { adminDb } from '@/lib/firebase-admin';
import { SEED_SKIM_CONTENT } from './seed-content';
import {
  passThreshold,
  type SkimContent, type SkimStep, type PublicSkimStep,
  type SkimProgress, type SkimStepProgress, type StepState, type SkimQuestionResult,
} from './types';

export const SKIM_CONTENT_COL = 'skimming_content';

/** The published edition (Firestore), or the committed seed if none is published. */
export async function loadSkimContent(): Promise<SkimContent> {
  if (adminDb) {
    try {
      const snap = await adminDb.collection(SKIM_CONTENT_COL).doc('current').get();
      const d = snap.data() as SkimContent | undefined;
      if (d?.steps?.length) return d;
    } catch { /* fall back to seed */ }
  }
  return SEED_SKIM_CONTENT;
}

/** Student-facing steps — answer keys, feedback and tricks removed. */
export function toPublicSteps(content: SkimContent): PublicSkimStep[] {
  return content.steps.map((s) => ({
    id: s.id, title: s.title, level: s.level, objective: s.objective, passage: s.passage,
    questions: s.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: q.options })),
    passMark: passThreshold(s.questions.length),
    total: s.questions.length,
  }));
}

export function defaultProgress(version: string): SkimProgress {
  return { version, steps: {}, badgeAwarded: false, badgeAt: null, updatedAt: Date.now() };
}

/** Lock state for each step, in order. Step N unlocks once step N-1 is passed. */
export function stepStates(content: SkimContent, progress: SkimProgress): Record<string, StepState> {
  const out: Record<string, StepState> = {};
  let prevPassed = true; // first step is always unlocked
  for (const s of content.steps) {
    const p = progress.steps[s.id];
    if (p?.passed) out[s.id] = 'passed';
    else if (!prevPassed) out[s.id] = 'locked';
    else out[s.id] = p && p.attempts > 0 ? 'in_progress' : 'ready';
    prevPassed = !!p?.passed;
  }
  return out;
}

export function isStepUnlocked(content: SkimContent, progress: SkimProgress, stepId: string): boolean {
  const idx = content.steps.findIndex((s) => s.id === stepId);
  if (idx < 0) return false;
  if (idx === 0) return true;
  return !!progress.steps[content.steps[idx - 1].id]?.passed;
}

export interface GradedStep {
  stepId: string;
  score: number;
  total: number;
  passMark: number;
  passed: boolean;
  results: SkimQuestionResult[];
}

/** Grade one step's answers (answers: questionId -> selected option index). */
export function gradeStep(step: SkimStep, answers: Record<string, unknown>): GradedStep {
  const results: SkimQuestionResult[] = step.questions.map((q) => {
    const raw = answers[q.id];
    const selected = Number.isInteger(raw) && (raw as number) >= 0 && (raw as number) < q.options.length ? (raw as number) : null;
    const isCorrect = selected === q.correct;
    return {
      id: q.id,
      selected,
      correct: q.correct,
      isCorrect,
      teacherExplanation: q.teacherExplanation,
      revealTrick: q.revealTrick,
      wrongReason: !isCorrect && selected != null ? (q.wrongReasons[String(selected)] ?? null) : null,
    };
  });
  const score = results.filter((r) => r.isCorrect).length;
  const total = step.questions.length;
  const passMark = passThreshold(total);
  return { stepId: step.id, score, total, passMark, passed: score >= passMark, results };
}

/** Merge a fresh attempt into a step's stored progress (keeps first/best/latest). */
export function mergeStepProgress(prev: SkimStepProgress | undefined, score: number, passed: boolean): SkimStepProgress {
  return {
    passed: !!prev?.passed || passed,
    firstScore: prev?.firstScore ?? score,
    bestScore: prev ? Math.max(prev.bestScore ?? 0, score) : score,
    latestScore: score,
    attempts: (prev?.attempts ?? 0) + 1,
  };
}

/** True once every step in the content is passed. */
export function allPassed(content: SkimContent, progress: SkimProgress): boolean {
  return content.steps.every((s) => progress.steps[s.id]?.passed);
}
