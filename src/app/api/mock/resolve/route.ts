import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { syncProgress, isFinished, TIMING_VERSION } from '@/lib/mock-runtime';
import type { MockAttempt } from '@/types/mock-test';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Works out what a student should see when they open a mock:
 *   in_progress → resume that attempt
 *   scored      → show their result (never silently start a new paid attempt)
 *   none        → the pre-exam intro
 *
 * Without this, revisiting a finished mock showed the exam intro again and
 * starting it would quietly spend another credit.
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

    const { searchParams } = new URL(request.url);
    const mockId = searchParams.get('mockId');
    if (!mockId) return NextResponse.json({ error: 'mockId is required.' }, { status: 400 });

    // Resume takes priority over showing an older result.
    const running = await adminDb
      .collection('mock_attempts')
      .where('userId', '==', uid)
      .where('mockId', '==', mockId)
      .where('status', '==', 'in_progress')
      .limit(1)
      .get();

    if (!running.empty) {
      const doc = running.docs[0];
      const a = { id: doc.id, ...(doc.data() as MockAttempt) };
      const now = Date.now();
      const changed = syncProgress(a, now);

      // Its time is fully gone — finish it rather than offering a dead resume.
      if (isFinished(a)) {
        await doc.ref.update({
          status: 'submitted',
          questions: a.questions,
          currentIndex: a.currentIndex,
          timingVersion: a.timingVersion ?? TIMING_VERSION,
        });
        return NextResponse.json({ state: 'submitted', attemptId: doc.id });
      }

      if (changed) {
        await doc.ref.update({
          questions: a.questions,
          currentIndex: a.currentIndex,
          timingVersion: a.timingVersion ?? TIMING_VERSION,
        });
      }
      return NextResponse.json({ state: 'in_progress', attemptId: doc.id });
    }

    // Otherwise the most recent scored attempt, if any.
    const scored = await adminDb
      .collection('mock_attempts')
      .where('userId', '==', uid)
      .where('mockId', '==', mockId)
      .where('status', '==', 'scored')
      .get();

    if (!scored.empty) {
      const latest = scored.docs
        .map(d => ({ id: d.id, scoredAt: (d.data().scoredAt as number) ?? 0 }))
        .sort((a, b) => b.scoredAt - a.scoredAt)[0];
      return NextResponse.json({ state: 'scored', attemptId: latest.id });
    }

    // A submitted-but-unscored attempt can be finished off by /api/mock/submit.
    const submitted = await adminDb
      .collection('mock_attempts')
      .where('userId', '==', uid)
      .where('mockId', '==', mockId)
      .where('status', '==', 'submitted')
      .limit(1)
      .get();

    if (!submitted.empty) {
      return NextResponse.json({ state: 'submitted', attemptId: submitted.docs[0].id });
    }

    return NextResponse.json({ state: 'none' });
  } catch (error) {
    console.error('[mock/resolve] error:', error);
    return NextResponse.json({ error: 'Could not load your attempt.' }, { status: 500 });
  }
}
