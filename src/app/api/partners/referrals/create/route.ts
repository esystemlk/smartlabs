import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A partner logs a manual referral. Server attaches partnerUid + consent time,
 * status starts at `new`, and the partner's `referred` counter increments.
 * Only active + approved partners may create referrals.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Session expired.' }, { status: 401 }); }

    const body = (await request.json()) as { studentName?: string; studentContact?: string; note?: string; consent?: boolean };
    const studentName = (body.studentName ?? '').trim();
    const studentContact = (body.studentContact ?? '').trim();
    const note = (body.note ?? '').trim();
    if (studentName.length < 2) return NextResponse.json({ error: 'Student name is required.' }, { status: 400 });
    if (!studentContact) return NextResponse.json({ error: 'A phone or email for the student is required.' }, { status: 400 });
    if (!body.consent) return NextResponse.json({ error: 'Please confirm the student agreed to be referred.' }, { status: 400 });

    const partnerRef = adminDb.collection('partners').doc(uid);
    const snap = await partnerRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Not a partner account.' }, { status: 404 });
    const p = snap.data() as { reviewStatus?: string; accountState?: string; referralCode?: string };
    if (p.reviewStatus !== 'approved' || ['suspended', 'deactivated', 'banned', 'closed'].includes(p.accountState ?? '')) {
      return NextResponse.json({ error: 'Your account must be active to add referrals.' }, { status: 403 });
    }
    try { if (!(await adminAuth.getUser(uid)).emailVerified) return NextResponse.json({ error: 'Please verify your email first.' }, { status: 403 }); }
    catch { /* if lookup fails, fall through */ }

    const now = FieldValue.serverTimestamp();
    const refDoc = adminDb.collection('referrals').doc();
    await adminDb.runTransaction(async (tx) => {
      tx.set(refDoc, {
        partnerUid: uid,
        code: p.referralCode ?? 'manual',
        studentName, studentContact, note: note || null,
        source: 'manual',
        status: 'new', // new | contacted | enrolled | paid | rewarded | rejected
        consentAt: now, createdAt: now, updatedAt: now,
        history: [{ status: 'new', by: 'partner', at: new Date().toISOString() }],
      });
      tx.set(partnerRef, { counters: { referred: FieldValue.increment(1) } }, { merge: true });
    });

    return NextResponse.json({ success: true, id: refDoc.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/referrals/create] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
