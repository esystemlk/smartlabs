import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { scoreWfd, performanceSummary } from '@/lib/wfd-scoring';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Scores a Write From Dictation attempt.
 *
 * Deterministic — no AI call, so it's instant and costs nothing. The
 * transcript is fetched server-side by questionId so the answer is never sent
 * to the client beforehand.
 *
 * Body: { questionId, answer }
 */
export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    }

    // Signed-in students only (ties attempts to an account); no credits are
    // charged because there is no AI cost.
    const header = request.headers.get('Authorization');
    if (!header?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'You must be signed in to score your answer.', code: 'NO_AUTH' },
        { status: 401 }
      );
    }
    try {
      await adminAuth.verifyIdToken(header.slice(7));
    } catch {
      return NextResponse.json(
        { error: 'Your session has expired. Please sign in again.', code: 'INVALID_AUTH' },
        { status: 401 }
      );
    }

    const { questionId, answer } = (await request.json()) as {
      questionId?: string;
      answer?: string;
    };
    if (!questionId || typeof answer !== 'string') {
      return NextResponse.json({ error: 'questionId and answer are required.' }, { status: 400 });
    }

    const snap = await adminDb.collection('pte_questions').doc(questionId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: 'Question not found.' }, { status: 404 });
    }
    const q = snap.data()!;
    if (q.taskType !== 'write-from-dictation') {
      return NextResponse.json({ error: 'Not a dictation question.' }, { status: 400 });
    }

    const transcript = String(q.content ?? '').trim();
    if (!transcript) {
      return NextResponse.json({ error: 'This question has no transcript yet.' }, { status: 400 });
    }

    const result = scoreWfd(transcript, answer);

    return NextResponse.json({
      ...result,
      title: q.title ?? 'Dictation',
      overallPerformance: performanceSummary(result),
    });
  } catch (error) {
    console.error('[score-wfd] error:', error);
    return NextResponse.json({ error: 'Scoring failed. Please try again.' }, { status: 500 });
  }
}
