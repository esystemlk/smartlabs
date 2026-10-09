import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyIeltsMockCredit, deductIeltsMockCredit, refundIeltsMockCredit } from '@/lib/ielts-mock-credits';
import { getMock } from '@/lib/ielts-mock/mocks';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.', code: 'UNAUTHENTICATED' }, { status: 401 });

    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Your session has expired. Please sign in again.', code: 'SESSION_EXPIRED' }, { status: 401 }); }

    const { mockId } = await request.json();
    const mock = getMock(String(mockId));
    if (!mock) return NextResponse.json({ error: 'Unknown mock test.' }, { status: 400 });

    const credit = await verifyIeltsMockCredit(uid);
    if (!credit.ok) return NextResponse.json({ error: credit.message, code: credit.code, remaining: credit.remaining }, { status: credit.status });

    await deductIeltsMockCredit(uid);
    try {
      const ref = await adminDb.collection('users').doc(uid).collection('ielts_mock_attempts').add({
        mockId: mock.id,
        title: mock.title,
        status: 'in_progress',
        startedAt: FieldValue.serverTimestamp(),
      });
      return NextResponse.json({ ok: true, attemptId: ref.id });
    } catch (e) {
      await refundIeltsMockCredit(uid);
      throw e;
    }
  } catch (error) {
    console.error('[ielts-mock/start]', error);
    return NextResponse.json({ error: 'Could not start the mock test. Please try again.' }, { status: 500 });
  }
}
