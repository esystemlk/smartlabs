import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getMock } from '@/lib/ielts-mock/mocks';
import { getListeningBundle, getReadingBundle } from '@/lib/ielts-mock/registry.server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEV_ROLES = new Set(['admin', 'developer']);

// Developer-only: returns the correct answers for a mock so the dev debug panel
// can auto-fill the fields and exercise scoring end-to-end. Gated to staff.
export async function GET(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }

    const snap = await adminDb.collection('users').doc(uid).get();
    const role = (snap.data()?.role as string) ?? 'student';
    if (!DEV_ROLES.has(role)) return NextResponse.json({ error: 'Developer only.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const mock = getMock(String(searchParams.get('mockId')));
    if (!mock) return NextResponse.json({ error: 'Unknown mock.' }, { status: 400 });

    const lb = getListeningBundle(mock.listening.testId);
    const rb = getReadingBundle(mock.reading.testId);
    if (!lb || !rb) return NextResponse.json({ error: 'Data unavailable.' }, { status: 500 });

    const firstAnswers = (bundle: typeof lb) => {
      const out: Record<number, string> = {};
      for (const q of bundle.data.questions as Array<{ id: number; kind: string }>) {
        if (q.kind === 'unavailable') continue;
        const accepted = bundle.key[q.id];
        if (accepted?.length) out[q.id] = accepted[0];
      }
      return out;
    };

    return NextResponse.json({ listening: firstAnswers(lb), reading: firstAnswers(rb) });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
