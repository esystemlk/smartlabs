import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { DEADLINE_GRACE_SECONDS, type MockAttempt } from '@/types/mock-test';
import { syncProgress, isFinished, TIMING_VERSION } from '@/lib/mock-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Autosave / advance for a mock attempt.
 *
 * Body: { attemptId, index, answer, advance?, blurCount?, pasteCount? }
 *
 * The whole point of this route is the requirement that a student's
 * half-written answer is kept when time runs out. Every keystroke batch is
 * persisted server-side, so an auto-advance (or a crash, or a closed tab)
 * never loses what they had typed.
 */
export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const header = request.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }
    let uid: string;
    try {
      uid = (await adminAuth.verifyIdToken(header.slice(7))).uid;
    } catch {
      return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
    }

    const { attemptId, index, answer, advance, blurCount, pasteCount } = (await request.json()) as {
      attemptId?: string;
      index?: number;
      answer?: string;
      advance?: boolean;
      blurCount?: number;
      pasteCount?: number;
    };

    if (!attemptId || typeof index !== 'number' || typeof answer !== 'string') {
      return NextResponse.json({ error: 'attemptId, index and answer are required.' }, { status: 400 });
    }

    const ref = adminDb.collection('mock_attempts').doc(attemptId);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Attempt not found.' }, { status: 404 });

    const attempt = snap.data() as MockAttempt;
    if (attempt.userId !== uid) {
      return NextResponse.json({ error: 'Not your attempt.' }, { status: 403 });
    }
    if (attempt.status !== 'in_progress') {
      return NextResponse.json({ error: 'This attempt is already finished.', status: attempt.status }, { status: 409 });
    }
    if (index < 0 || index >= attempt.questions.length) {
      return NextResponse.json({ error: 'Invalid question index.' }, { status: 400 });
    }

    const now = Date.now();
    const q = attempt.questions[index];
    const graceMs = DEADLINE_GRACE_SECONDS * 1000;

    // Bring the record up to date FIRST. On an attempt written before
    // per-question timing existed the stored deadline is NaN, and `now > NaN`
    // is false — so without this every stale answer looked savable.
    syncProgress(attempt, now);

    // Writes are refused once a question's own deadline has passed (plus a
    // small grace for network lag) — a student cannot go back and edit an
    // earlier answer after moving on.
    const expired = !Number.isFinite(q.deadlineAt) || now > q.deadlineAt + graceMs;
    if (!expired) {
      q.answer = answer;
      q.answeredAt = now;
      if (typeof blurCount === 'number') q.blurCount = blurCount;
      if (typeof pasteCount === 'number') q.pasteCount = pasteCount;
    } else {
      q.lateSubmission = true;
    }

    // Manual "Next" moves on by one; it can never go backwards.
    if (advance && index >= attempt.currentIndex) {
      attempt.currentIndex = Math.min(index + 1, attempt.questions.length);
    }

    // Then let the clock take over: start the timer on the question the
    // student has just been moved to.
    syncProgress(attempt, now);
    const finished = isFinished(attempt);

    await ref.update({
      questions: attempt.questions,
      currentIndex: attempt.currentIndex,
      timingVersion: attempt.timingVersion ?? TIMING_VERSION,
    });

    return NextResponse.json({
      ok: true,
      saved: !expired,
      currentIndex: attempt.currentIndex,
      finished,
      serverNow: now,
    });
  } catch (error) {
    console.error('[mock/save] error:', error);
    return NextResponse.json({ error: 'Save failed.' }, { status: 500 });
  }
}
