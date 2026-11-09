import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getMock } from '@/lib/ielts-mock/mocks';
import { getListeningBundle, getReadingBundle, reviewTest } from '@/lib/ielts-mock/registry.server';
import type { IeltsMockReview } from '@/lib/ielts-mock/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Returns correct answers, so only for the student's own finished attempt.
export async function GET(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.', code: 'UNAUTHENTICATED' }, { status: 401 });

    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' }, { status: 401 }); }

    const attemptId = new URL(request.url).searchParams.get('attemptId');
    if (!attemptId) return NextResponse.json({ error: 'Missing mock attempt.' }, { status: 400 });

    const attempt = (await adminDb.collection('users').doc(uid).collection('ielts_mock_attempts').doc(attemptId).get()).data();
    if (!attempt || attempt.status !== 'completed' || !attempt.result) return NextResponse.json({ error: 'This mock has not been scored yet.' }, { status: 404 });

    const mock = getMock(String(attempt.result.mockId));
    const listening = mock && getListeningBundle(mock.listening.testId);
    const reading = mock && getReadingBundle(mock.reading.testId);
    if (!listening || !reading) return NextResponse.json({ error: 'Mock test data is unavailable.' }, { status: 500 });

    const review: IeltsMockReview = {
      listening: attempt.listeningAnswers ? reviewTest(listening, attempt.listeningAnswers) : null,
      reading: attempt.readingAnswers ? reviewTest(reading, attempt.readingAnswers) : null,
    };
    return NextResponse.json(review);
  } catch (error) {
    console.error('[ielts-mock/review]', error);
    return NextResponse.json({ error: 'Could not load your answers. Please try again.' }, { status: 500 });
  }
}
