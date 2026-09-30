import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Attributes a newly signed-up student to the partner whose referral code they
 * arrived with. Called (best-effort) from the student signup flow with the
 * STUDENT's own ID token, so studentUid can't be forged. A student can only be
 * attributed once, to the first partner. Self-referral is ignored.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ ok: false }, { status: 200 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ ok: false }, { status: 200 });
    let studentUid: string;
    try { studentUid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ ok: false }, { status: 200 }); }

    const { code, studentName, studentContact } = (await request.json()) as
      { code?: string; studentName?: string; studentContact?: string };
    const clean = (code ?? '').trim().toUpperCase();
    if (!clean) return NextResponse.json({ ok: false }, { status: 200 });

    // Resolve the code → partner, and ensure it's still active.
    const codeSnap = await adminDb.collection('partner_codes').doc(clean).get();
    const codeData = codeSnap.data() as { uid?: string; active?: boolean } | undefined;
    if (!codeSnap.exists || codeData?.active === false || !codeData?.uid) return NextResponse.json({ ok: false }, { status: 200 });
    const partnerUid = codeData.uid;

    // No self-referral.
    if (partnerUid === studentUid) return NextResponse.json({ ok: false, reason: 'self' }, { status: 200 });

    // The partner must still be approved + not restricted.
    const partnerSnap = await adminDb.collection('partners').doc(partnerUid).get();
    const partner = partnerSnap.data() as { reviewStatus?: string; accountState?: string } | undefined;
    if (!partner || partner.reviewStatus !== 'approved' || ['suspended', 'deactivated', 'banned', 'closed'].includes(partner.accountState ?? '')) {
      return NextResponse.json({ ok: false }, { status: 200 });
    }

    // A student is attributed once only — to the first partner.
    const existing = await adminDb.collection('referrals').where('studentUid', '==', studentUid).limit(1).get();
    if (!existing.empty) return NextResponse.json({ ok: false, reason: 'already' }, { status: 200 });

    const now = FieldValue.serverTimestamp();
    const refDoc = adminDb.collection('referrals').doc();
    await adminDb.runTransaction(async (tx) => {
      // Re-check inside the transaction to avoid a double-write race.
      const dup = await tx.get(adminDb!.collection('referrals').where('studentUid', '==', studentUid).limit(1));
      if (!dup.empty) return;
      tx.set(refDoc, {
        partnerUid, code: clean, studentUid,
        studentName: (studentName ?? '').trim() || null,
        studentContact: (studentContact ?? '').trim() || null,
        source: 'link',
        status: 'new',
        consentAt: now, createdAt: now, updatedAt: now,
        history: [{ status: 'new', by: 'link', at: new Date().toISOString() }],
      });
      tx.set(adminDb!.collection('partners').doc(partnerUid), { counters: { referred: FieldValue.increment(1) } }, { merge: true });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[partners/attribute] error:', error);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
