import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import {
  MOCK_AUDIO_PLAYS, DEADLINE_GRACE_SECONDS, type MockAttempt,
} from '@/types/mock-test';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const AUDIO_TASKS = new Set(['write-from-dictation', 'summarize-spoken-text']);

/**
 * Consumes one audio play on the CURRENT question.
 *
 * The play counter used to live only in React state, so refreshing the tab
 * reset it and the "plays once" rule could be replayed indefinitely. The count
 * now lives on the attempt document and is incremented here, inside a
 * transaction, so two tabs cannot each spend the same play.
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

    const { attemptId, index } = (await request.json()) as {
      attemptId?: string; index?: number;
    };
    if (!attemptId || typeof index !== 'number') {
      return NextResponse.json({ error: 'attemptId and index are required.' }, { status: 400 });
    }

    const ref = adminDb.collection('mock_attempts').doc(attemptId);

    const result = await adminDb.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) return { status: 404, body: { error: 'Attempt not found.' } };

      const attempt = snap.data() as MockAttempt;
      if (attempt.userId !== uid) return { status: 403, body: { error: 'Not your attempt.' } };
      if (attempt.status !== 'in_progress') {
        return { status: 409, body: { error: 'This exam is already finished.' } };
      }
      // Only the question actually in front of the student — no reading ahead.
      if (index !== attempt.currentIndex) {
        return { status: 409, body: { error: 'That question is no longer active.' } };
      }

      const q = attempt.questions[index];
      if (!q) return { status: 400, body: { error: 'Unknown question.' } };
      if (!AUDIO_TASKS.has(q.taskType)) {
        return { status: 400, body: { error: 'This question has no audio.' } };
      }
      // Its time is already gone — the runner will move on.
      if (q.deadlineAt > 0 && Date.now() > q.deadlineAt + DEADLINE_GRACE_SECONDS * 1000) {
        return { status: 409, body: { error: 'Time is up for this question.' } };
      }

      const used = q.audioPlays ?? 0;
      if (used >= MOCK_AUDIO_PLAYS) {
        return {
          status: 409,
          body: { error: 'No plays left for this audio.', playsUsed: used, playsAllowed: MOCK_AUDIO_PLAYS },
        };
      }

      const questions = attempt.questions.map((item, i) =>
        i === index ? { ...item, audioPlays: used + 1 } : item
      );
      tx.update(ref, { questions });

      return {
        status: 200,
        body: { playsUsed: used + 1, playsAllowed: MOCK_AUDIO_PLAYS },
      };
    });

    return NextResponse.json(result.body, { status: result.status });
  } catch (error) {
    console.error('[mock/play] error:', error);
    return NextResponse.json({ error: 'Could not start the audio.' }, { status: 500 });
  }
}
