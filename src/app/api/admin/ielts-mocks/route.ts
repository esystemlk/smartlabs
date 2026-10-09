import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Staff-only: look up a single student's IELTS mock results BY EMAIL.
 * Deliberately requires an exact email — it never lists all students, so no
 * directory of system emails is exposed. Returns only completed attempts.
 */
export async function GET(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
    const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
    if (!['admin', 'developer', 'teacher'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });

    const email = (new URL(request.url).searchParams.get('email') ?? '').trim().toLowerCase();
    if (!email) return NextResponse.json({ error: 'Enter a student email to search.' }, { status: 400 });

    let student;
    try { student = await adminAuth.getUserByEmail(email); }
    catch { return NextResponse.json({ found: false, error: 'No account found for that email.' }, { status: 404 }); }

    const snap = await adminDb
      .collection('users').doc(student.uid).collection('ielts_mock_attempts')
      .orderBy('completedAt', 'desc').limit(50).get();

    const toMs = (v: unknown) => {
      const d = v as { toDate?: () => Date; seconds?: number } | undefined;
      if (d?.toDate) return d.toDate().getTime();
      if (typeof d?.seconds === 'number') return d.seconds * 1000;
      return 0;
    };

    const attempts = snap.docs
      .map(doc => ({ id: doc.id, data: doc.data() }))
      .filter(x => x.data.status === 'completed' && x.data.result)
      .map(x => ({
        id: x.id,
        title: String(x.data.title ?? x.data.result?.title ?? 'Mock test'),
        overall: Number(x.data.overall ?? x.data.result?.overall ?? 0),
        listeningBand: Number(x.data.listeningBand ?? x.data.result?.listening?.band ?? 0),
        readingBand: Number(x.data.readingBand ?? x.data.result?.reading?.band ?? 0),
        writingBand: Number(x.data.writingBand ?? x.data.result?.writing?.band ?? 0),
        completedAtMs: toMs(x.data.completedAt),
        result: x.data.result, // full result for PDF download
      }));

    return NextResponse.json({
      found: true,
      student: { name: student.displayName ?? 'Student', email: student.email ?? email },
      attempts,
    });
  } catch (error) {
    console.error('[admin/ielts-mocks]', error);
    return NextResponse.json({ error: 'Internal error.' }, { status: 500 });
  }
}
