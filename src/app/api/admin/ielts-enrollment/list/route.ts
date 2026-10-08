import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Staff-only: list IELTS course enrolments for the admin panel. */
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

    const snap = await adminDb.collection('ielts_course_enrollments').limit(500).get();
    const toMillis = (v: unknown) => {
      const d = v as { toDate?: () => Date; seconds?: number } | undefined;
      if (d?.toDate) return d.toDate().getTime();
      if (typeof d?.seconds === 'number') return d.seconds * 1000;
      return 0;
    };
    const rows = snap.docs.map((doc) => {
      const e = doc.data();
      return {
        orderId: String(e.orderId ?? doc.id),
        userId: String(e.userId ?? ''),
        fullName: String(e.fullName ?? ''),
        phone: String(e.phone ?? ''),
        email: String(e.email ?? ''),
        amountPaid: Number(e.amountPaid ?? 0),
        batchStatus: String(e.batchStatus ?? 'awaiting_batch'),
        batchName: String(e.batchName ?? ''),
        startDate: String(e.startDate ?? ''),
        schedule: String(e.schedule ?? ''),
        whatsappLink: String(e.whatsappLink ?? ''),
        createdAtMs: toMillis(e.createdAt),
      };
    }).sort((a, b) => b.createdAtMs - a.createdAtMs);

    return NextResponse.json({ enrollments: rows }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[admin/ielts-enrollment/list] error:', error);
    return NextResponse.json({ error: 'Could not load enrolments.' }, { status: 500 });
  }
}
