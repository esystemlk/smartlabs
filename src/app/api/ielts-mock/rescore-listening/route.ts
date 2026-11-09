import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { getMock } from '@/lib/ielts-mock/mocks';
import { getListeningBundle, gradeTest } from '@/lib/ielts-mock/registry.server';
import { withListeningScore } from '@/lib/ielts-mock/bands';
import type { IeltsMockResult } from '@/lib/ielts-mock/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Re-marks the answers saved at submission. Never accepts answers from the
// browser, so a student cannot change what they wrote after seeing their score.
export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.', code: 'UNAUTHENTICATED' }, { status: 401 });

    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' }, { status: 401 }); }

    const { attemptId } = await request.json();
    if (!attemptId) return NextResponse.json({ error: 'Missing mock attempt.' }, { status: 400 });

    const attemptRef = adminDb.collection('users').doc(uid).collection('ielts_mock_attempts').doc(String(attemptId));
    const attempt = (await attemptRef.get()).data();
    const saved = attempt?.result as IeltsMockResult | undefined;
    if (!attempt || attempt.status !== 'completed' || !saved) return NextResponse.json({ error: 'This mock has not been scored yet.' }, { status: 404 });
    if (!attempt.listeningAnswers) return NextResponse.json({ error: 'Listening answers were not saved for this older mock, so it cannot be re-scored.', code: 'NO_SAVED_ANSWERS' }, { status: 409 });

    const mock = getMock(saved.mockId);
    const bundle = mock && getListeningBundle(mock.listening.testId);
    if (!bundle) return NextResponse.json({ error: 'Mock test data is unavailable.' }, { status: 500 });

    const { raw, total } = gradeTest(bundle, attempt.listeningAnswers);
    const result = withListeningScore(saved, raw, total);
    await attemptRef.update({
      result, overall: result.overall, listeningBand: result.listening.band, listeningRaw: raw,
      listeningRescoredAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ result });
  } catch (error) {
    console.error('[ielts-mock/rescore-listening]', error);
    return NextResponse.json({ error: 'Could not re-score Listening. Please try again.' }, { status: 500 });
  }
}
