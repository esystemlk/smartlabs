/**
 * Writing Mock Test — shared types, timing and score aggregation.
 * See MOCK_TEST_PLAN.md for the full design.
 */

export type MockTaskType = 'swt' | 'write-essay' | 'summarize-spoken-text' | 'write-from-dictation';

export interface MockSectionSpec {
  taskType: MockTaskType;
  label: string;
  /** How many questions this slot must contain. */
  count: number;
  /** Per-question time limit, in seconds. */
  secondsPerQuestion: number;
  /** Section of the real PTE exam this task belongs to (for honest labelling). */
  realSection: 'Writing' | 'Listening';
  instructions: string;
}

/** The fixed shape of Writing Mock 1. Admin picks the questions, not the structure. */
export const MOCK_BLUEPRINT: MockSectionSpec[] = [
  {
    taskType: 'swt',
    label: 'Summarize Written Text',
    count: 2,
    secondsPerQuestion: 600,
    realSection: 'Writing',
    instructions:
      'Read the passage below and summarise it using ONE sentence (5–75 words). You have 10 minutes.',
  },
  {
    taskType: 'write-essay',
    label: 'Write Essay',
    count: 1,
    secondsPerQuestion: 1200,
    realSection: 'Writing',
    instructions:
      'You will have 20 minutes to plan, write and revise an essay of 200–300 words about the topic below.',
  },
  {
    taskType: 'summarize-spoken-text',
    label: 'Summarize Spoken Text',
    count: 1,
    secondsPerQuestion: 600,
    realSection: 'Listening',
    instructions:
      'You will hear a short lecture. Write a summary of 50–70 words. The audio plays ONCE. You have 10 minutes.',
  },
  {
    taskType: 'write-from-dictation',
    label: 'Write From Dictation',
    count: 4,
    secondsPerQuestion: 60,
    realSection: 'Listening',
    instructions:
      'You will hear a sentence. Type it exactly as you hear it. The audio plays ONCE. You have 1 minute.',
  },
];

/** Total questions in a mock (8). */
export const MOCK_TOTAL_QUESTIONS = MOCK_BLUEPRINT.reduce((n, s) => n + s.count, 0);

/** Total exam duration in seconds (3240 = 54 minutes). */
export const MOCK_TOTAL_SECONDS = MOCK_BLUEPRINT.reduce(
  (n, s) => n + s.count * s.secondsPerQuestion,
  0
);

/** Timer UI thresholds (seconds remaining). */
export const WARN_AT_SECONDS = 120; // amber
export const DANGER_AT_SECONDS = 30; // red

/** Audio plays allowed per question inside a mock (real exam = 1). */
export const MOCK_AUDIO_PLAYS = 1;

/** Grace period added to each server-side deadline to absorb network latency. */
export const DEADLINE_GRACE_SECONDS = 5;

// ─── Definitions & attempts ─────────────────────────────────────────────────

export interface MockSection {
  taskType: MockTaskType;
  questionIds: string[];
  secondsPerQuestion: number;
}

export interface MockTest {
  id?: string;
  title: string;
  description?: string;
  active: boolean;
  sections: MockSection[];
  createdAt?: unknown;
  updatedAt?: unknown;
  createdBy?: string;
}

export type MockAttemptStatus = 'in_progress' | 'submitted' | 'scored' | 'abandoned';

export interface MockAttemptQuestion {
  questionId: string;
  taskType: MockTaskType;
  order: number;
  /** Absolute server timestamp (ms) when this question closes. */
  deadlineAt: number;
  answer: string;
  answeredAt?: number;
  lateSubmission?: boolean;
  blurCount?: number;
  pasteCount?: number;
}

export interface MockTaskScore {
  questionId: string;
  taskType: MockTaskType;
  /** Raw score in the task's own scale. */
  raw: number;
  /** Maximum possible raw score for this task. */
  max: number;
  /** 0–100. */
  percent: number;
  /** Full result payload from the underlying scorer, for the detail view. */
  detail?: unknown;
  /** Set when the scorer failed after retries — mock still completes. */
  scoreFailed?: boolean;
  error?: string;
}

export interface MockOverall {
  band: number;
  label: string;
  /** True when one or more tasks failed to score. */
  partial: boolean;
  scoredTasks: number;
  totalTasks: number;
}

export interface MockAttempt {
  id?: string;
  mockId: string;
  mockTitle?: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  status: MockAttemptStatus;
  startedAt: number;
  expiresAt: number;
  currentIndex: number;
  questions: MockAttemptQuestion[];
  taskScores?: MockTaskScore[];
  overall?: MockOverall;
  scoredAt?: number;
}

// ─── Score aggregation ──────────────────────────────────────────────────────

/** Raw maximum for each task, matching what our scorers actually return. */
export const TASK_MAX: Record<MockTaskType, number> = {
  swt: 9, // content 4 + form 1 + grammar 2 + vocabulary 2
  'write-essay': 26, // 7 criteria
  'summarize-spoken-text': 12, // content 4 + form 2 + grammar 2 + vocab 2 + spelling 2
  'write-from-dictation': 100, // percent accuracy
};

/**
 * Weight of each TASK TYPE in the overall band (must total 100).
 * Split evenly across that type's questions.
 */
export const TASK_WEIGHT: Record<MockTaskType, number> = {
  'write-essay': 35,
  swt: 30,
  'summarize-spoken-text': 20,
  'write-from-dictation': 15,
};

export function bandLabel(band: number): string {
  if (band >= 85) return 'Expert';
  if (band >= 79) return 'Advanced';
  if (band >= 65) return 'Upper Intermediate';
  if (band >= 50) return 'Intermediate';
  if (band >= 30) return 'Developing';
  return 'Beginner';
}

/**
 * Combine per-task scores into one 0–90 band.
 *
 * Each task type carries a fixed weight, shared evenly between its questions.
 * Tasks that failed to score are excluded and their weight is redistributed
 * proportionally, so one AI failure can't drag the band to zero.
 */
export function aggregateScores(scores: MockTaskScore[]): MockOverall {
  const usable = scores.filter(s => !s.scoreFailed);
  const totalTasks = scores.length;

  if (usable.length === 0) {
    return { band: 0, label: bandLabel(0), partial: totalTasks > 0, scoredTasks: 0, totalTasks };
  }

  // Count questions per type among the usable scores so weight splits correctly.
  const countByType = usable.reduce<Record<string, number>>((acc, s) => {
    acc[s.taskType] = (acc[s.taskType] ?? 0) + 1;
    return acc;
  }, {});

  let weightedSum = 0;
  let weightUsed = 0;

  for (const s of usable) {
    const typeWeight = TASK_WEIGHT[s.taskType] ?? 0;
    const perQuestion = typeWeight / (countByType[s.taskType] || 1);
    weightedSum += s.percent * perQuestion;
    weightUsed += perQuestion;
  }

  // Redistribute across the weight actually present (handles partial failures).
  const normalised = weightUsed > 0 ? weightedSum / weightUsed : 0;
  // Multiply BEFORE dividing: (35/100)*90 evaluates to 31.4999… because 0.35
  // is inexact in binary, which silently costs a band point at .5 boundaries.
  const band = Math.round((normalised * 90) / 100);

  return {
    band,
    label: bandLabel(band),
    partial: usable.length < totalTasks,
    scoredTasks: usable.length,
    totalTasks,
  };
}

/** Convert a raw task score to a percentage, clamped to 0–100. */
export function toPercent(raw: number, max: number): number {
  if (!max) return 0;
  const pct = (raw / max) * 100;
  return Math.max(0, Math.min(100, Math.round(pct * 100) / 100));
}

/** Human-readable "54 minutes" style duration. */
export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s === 0 ? `${m} minutes` : `${m}m ${s}s`;
}

/** mm:ss for the countdown display. */
/** MM:SS, zero-padded like a real exam clock. Never shows a negative time. */
export function formatClock(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safe / 60);
  const s = safe % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
