import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getMockCredits } from '@/lib/mock-credits';
import { MOCK_BLUEPRINT, MOCK_TOTAL_QUESTIONS, MOCK_TOTAL_SECONDS, type MockTest, type MockAttempt } from '@/types/mock-test';
import { syncProgress, isFinished, TIMING_VERSION } from '@/lib/mock-runtime';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Student-facing list of available mock tests.
 *
 * Returns only what the catalogue needs — never the question ids, so the
 * exam content stays hidden until the attempt actually starts.
 */
export async function GET(request: Request) {
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

    const snap = await adminDb.collection('mock_tests').get();

    const mocks = snap.docs
      .map(d => {
        const m = d.data() as MockTest;
        // A mock is only startable when every blueprint slot is filled.
        const complete = MOCK_BLUEPRINT.every(spec => {
          const sec = m.sections?.find(s => s.taskType === spec.taskType);
          return (sec?.questionIds?.length ?? 0) === spec.count;
        });
        return {
          id: d.id,
          title: m.title,
          description: m.description ?? '',
          active: m.active !== false,
          complete,
          totalQuestions: MOCK_TOTAL_QUESTIONS,
          totalSeconds: MOCK_TOTAL_SECONDS,
        };
      })
      .filter(m => m.active && m.complete);

    // Attempts still running. An attempt whose time has fully run out must NOT
    // be offered as "Resume" — it is finished, so flip it to `submitted` and
    // let the student open it to get scored.
    const attemptsSnap = await adminDb
      .collection('mock_attempts')
      .where('userId', '==', uid)
      .where('status', '==', 'in_progress')
      .get();

    const now = Date.now();
    const inProgress: { attemptId: string; mockId: string }[] = [];
    const needsScoring: { attemptId: string; mockId: string }[] = [];

    await Promise.all(attemptsSnap.docs.map(async d => {
      const a = { id: d.id, ...(d.data() as MockAttempt) };
      const changed = syncProgress(a, now);

      if (isFinished(a)) {
        await d.ref.update({
          status: 'submitted',
          questions: a.questions,
          currentIndex: a.currentIndex,
          timingVersion: a.timingVersion ?? TIMING_VERSION,
        });
        needsScoring.push({ attemptId: d.id, mockId: a.mockId });
        return;
      }

      if (changed) {
        await d.ref.update({
          questions: a.questions,
          currentIndex: a.currentIndex,
          timingVersion: a.timingVersion ?? TIMING_VERSION,
        });
      }
      inProgress.push({ attemptId: d.id, mockId: a.mockId });
    }));

    // Most recent scored attempt per mock, for a "last result" badge.
    const scoredSnap = await adminDb
      .collection('mock_attempts')
      .where('userId', '==', uid)
      .where('status', '==', 'scored')
      .get();
    const bestByMock: Record<string, { attemptId: string; band: number; scoredAt: number }> = {};
    scoredSnap.docs.forEach(d => {
      const v = d.data();
      const mockId = v.mockId as string;
      const band = (v.overall?.band as number) ?? 0;
      const scoredAt = (v.scoredAt as number) ?? 0;
      if (!bestByMock[mockId] || scoredAt > bestByMock[mockId].scoredAt) {
        bestByMock[mockId] = { attemptId: d.id, band, scoredAt };
      }
    });

    const credits = await getMockCredits(uid);

    return NextResponse.json({
      mocks,
      inProgress,
      needsScoring,
      lastResults: bestByMock,
      credits: { unlimited: credits.unlimited, remaining: credits.remaining },
    });
  } catch (error) {
    console.error('[mock/list] error:', error);
    return NextResponse.json({ error: 'Could not load mock tests.' }, { status: 500 });
  }
}
