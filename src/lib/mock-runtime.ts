import { DEADLINE_GRACE_SECONDS, MOCK_BLUEPRINT, type MockAttempt } from '@/types/mock-test';

/**
 * Per-question timing for a mock attempt.
 *
 * Each question is timed INDEPENDENTLY: its clock starts the moment the
 * student reaches it, not on a fixed schedule computed at exam start.
 * Submitting a question early does not donate the leftover time to the next
 * one — exactly how the real exam behaves.
 */

export const TIMING_VERSION = 2;

/**
 * A question's own time budget. Older attempts were written before
 * `secondsAllowed` existed, so fall back to the blueprint and heal the record
 * (without it the deadline maths produces NaN and the timer breaks).
 */
function budgetSeconds(attempt: MockAttempt, index: number): number {
  const q = attempt.questions[index];
  if (typeof q.secondsAllowed === 'number' && q.secondsAllowed > 0) return q.secondsAllowed;
  const spec = MOCK_BLUEPRINT.find(s => s.taskType === q.taskType);
  const fallback = spec?.secondsPerQuestion ?? 600;
  q.secondsAllowed = fallback;
  return fallback;
}

/**
 * Rewrites a legacy attempt (one cumulative schedule) onto per-question
 * timing: the question the student is on restarts with its full budget, and
 * every later question is reset to "not reached yet".
 */
function healLegacyTiming(attempt: MockAttempt, now: number): boolean {
  if (attempt.timingVersion === TIMING_VERSION) return false;

  // If the original schedule has already run out, the exam is over. Healing
  // must NOT hand an abandoned attempt a fresh clock — that is what left a
  // finished exam sitting on "Resume" forever.
  const legacyEnd = Math.max(
    attempt.expiresAt ?? 0,
    ...attempt.questions.map(q => (Number.isFinite(q.deadlineAt) ? q.deadlineAt : 0))
  );
  if (legacyEnd > 0 && now > legacyEnd + DEADLINE_GRACE_SECONDS * 1000) {
    attempt.questions.forEach((_, i) => budgetSeconds(attempt, i));
    attempt.currentIndex = attempt.questions.length; // fully consumed
    attempt.timingVersion = TIMING_VERSION;
    return true;
  }

  attempt.questions.forEach((q, i) => {
    budgetSeconds(attempt, i);
    if (i < attempt.currentIndex) return;      // already used up, leave as history
    if (i === attempt.currentIndex) {
      q.startedAt = now;
      q.deadlineAt = now + q.secondsAllowed * 1000;
    } else {
      q.deadlineAt = 0;                        // clock starts when reached
      delete q.startedAt;
    }
  });

  attempt.timingVersion = TIMING_VERSION;
  return true;
}

/**
 * Stamps a question's deadline the first time it is reached.
 * Returns true when something changed (so callers know to persist).
 */
export function ensureDeadline(attempt: MockAttempt, index: number, now: number): boolean {
  const q = attempt.questions[index];
  if (!q) return false;
  const budget = budgetSeconds(attempt, index);
  // Treat a missing/NaN deadline as "not started" so a corrupt record heals.
  if (q.deadlineAt > 0 && Number.isFinite(q.deadlineAt)) return false;
  q.startedAt = now;
  q.deadlineAt = now + budget * 1000;
  return true;
}

/**
 * Brings an attempt up to date with the wall clock: walks past any question
 * whose own time has run out and starts the clock on the one now in front of
 * the student. Safe to call on every read.
 *
 * Returns true when the attempt changed and should be written back.
 */
export function syncProgress(attempt: MockAttempt, now: number): boolean {
  let changed = healLegacyTiming(attempt, now);
  const grace = DEADLINE_GRACE_SECONDS * 1000;

  // Outer safety bound. Without this an abandoned attempt never ends: every
  // question reached stamps a fresh clock from `now`, so it would sit on
  // "Resume" indefinitely no matter how long ago the student walked away.
  if (Number.isFinite(attempt.expiresAt) && attempt.expiresAt > 0 && now > attempt.expiresAt) {
    if (!isFinished(attempt)) {
      attempt.questions.forEach((_, i) => budgetSeconds(attempt, i));
      attempt.currentIndex = attempt.questions.length;
      changed = true;
    }
    return changed;
  }

  while (attempt.currentIndex < attempt.questions.length) {
    const q = attempt.questions[attempt.currentIndex];

    // Not started (or corrupt) → start its clock now and stop here.
    if (!(q.deadlineAt > 0) || !Number.isFinite(q.deadlineAt)) {
      changed = ensureDeadline(attempt, attempt.currentIndex, now) || changed;
      break;
    }

    // Time is up for this question → move to the next one.
    if (now > q.deadlineAt + grace) {
      attempt.currentIndex += 1;
      changed = true;
      continue;
    }

    break; // still inside this question's time
  }

  // Whatever question we landed on must have a running clock.
  if (attempt.currentIndex < attempt.questions.length) {
    changed = ensureDeadline(attempt, attempt.currentIndex, now) || changed;
  }

  return changed;
}

/** True when every question has been used up. */
export function isFinished(attempt: MockAttempt): boolean {
  return attempt.currentIndex >= attempt.questions.length;
}
