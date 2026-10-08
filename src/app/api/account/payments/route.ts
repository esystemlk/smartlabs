import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Returns the signed-in user's payment orders for the dashboard "My Payments". */
export async function GET(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Session expired.' }, { status: 401 }); }

    const snap = await adminDb.collection('payment_orders').where('userId', '==', uid).limit(100).get();
    const toMillis = (v: unknown) => {
      const d = (v as { toDate?: () => Date; seconds?: number } | undefined);
      if (d?.toDate) return d.toDate().getTime();
      if (typeof d?.seconds === 'number') return d.seconds * 1000;
      return 0;
    };
    const payments = snap.docs.map((d) => {
      const o = d.data();
      return {
        orderId: String(o.orderId ?? d.id),
        course: String(o.packageName ?? o.packageTitle ?? o.type ?? 'Course'),
        type: String(o.type ?? ''),
        amount: Number(o.paymentAmount ?? o.amountPaid ?? 0),
        status: String(o.paymentStatus ?? 'pending'),
        batchName: String(o.batchName ?? ''),
        addOns: Array.isArray(o.addOnLabels) ? o.addOnLabels : [],
        createdAtMs: toMillis(o.createdAt),
      };
    }).sort((a, b) => b.createdAtMs - a.createdAtMs);

    return NextResponse.json({ payments }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[account/payments] error:', error);
    return NextResponse.json({ error: 'Could not load payments.' }, { status: 500 });
  }
}
