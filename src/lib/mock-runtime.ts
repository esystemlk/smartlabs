import { DEADLINE_GRACE_SECONDS, type MockAttempt } from '@/types/mock-test';

/**
 * Per-question timing for a mock attempt.
 *
 * Each question is timed INDEPENDENTLY: its clock starts the moment the
 * student reaches it, not on a fixed schedule computed at exam start.
 * Submitting a question early does not donate the leftover time to the next
 * one — exactly how the real exam behaves.
 */

/**
 * Stamps a question's deadline the first time it is reached.
 * Returns true when something changed (so callers know to persist).
 */
export function ensureDeadline(attempt: MockAttempt, index: number, now: number): boolean {
  const q = attempt.questions[index];
  if (!q || q.deadlineAt > 0) return false;
  q.startedAt = now;
  q.deadlineAt = now + q.secondsAllowed * 1000;
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
  const grace = DEADLINE_GRACE_SECONDS * 1000;
  let changed = false;

  while (attempt.currentIndex < attempt.questions.length) {
    const q = attempt.questions[attempt.currentIndex];

    // Not started yet → start its clock now and stop here.
    if (q.deadlineAt === 0) {
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
