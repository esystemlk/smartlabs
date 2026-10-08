import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { renderPartnerPayoutEmail } from '@/lib/partner-payout-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';

async function requireStaff(request: Request): Promise<{ uid: string } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
  catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
  if (!['admin', 'developer', 'teacher'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return { uid };
}

/**
 * Pay a partner their commission for a referred student who enrolled: email the
 * partner (with a copy to contact@smartlabs.lk) showing the course fee, the
 * commission rate and the amount paid, record the payout on the referral, and
 * mark it rewarded.
 */
export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { referralId, courseFee, commissionPercent, courseName, note } = (await request.json()) as {
      referralId?: string; courseFee?: number; commissionPercent?: number; courseName?: string; note?: string;
    };
    if (!referralId) return NextResponse.json({ error: 'referralId is required.' }, { status: 400 });
    const fee = Number(courseFee);
    const pct = Number(commissionPercent);
    if (!Number.isFinite(fee) || fee <= 0) return NextResponse.json({ error: 'Enter a valid course fee.' }, { status: 400 });
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) return NextResponse.json({ error: 'Enter a valid commission percent.' }, { status: 400 });

    const refDoc = adminDb!.collection('referrals').doc(String(referralId));
    const snap = await refDoc.get();
    if (!snap.exists) return NextResponse.json({ error: 'Referral not found.' }, { status: 404 });
    const r = snap.data() as { partnerUid?: string; studentName?: string };
    if (!r.partnerUid) return NextResponse.json({ error: 'This referral has no partner.' }, { status: 400 });

    const partnerSnap = await adminDb!.collection('partners').doc(r.partnerUid).get();
    const partner = (partnerSnap.exists ? partnerSnap.data() : {}) as { email?: string; fullName?: string };
    if (!partner.email) return NextResponse.json({ error: 'The partner has no email on file.' }, { status: 400 });

    const payoutAmount = Math.round(fee * (pct / 100));
    const now = FieldValue.serverTimestamp();

    await refDoc.set({
      status: 'rewarded',
      payout: { courseFee: fee, commissionPercent: pct, amount: payoutAmount, courseName: (courseName ?? '').trim() || null, paidBy: staff.uid, paidAt: now },
      updatedAt: now,
      history: FieldValue.arrayUnion({ status: 'rewarded', by: `admin:${staff.uid}`, at: new Date().toISOString() }),
    }, { merge: true });

    // Keep the partner's rewarded counter in step (best-effort).
    adminDb!.collection('partners').doc(r.partnerUid)
      .set({ counters: { rewarded: FieldValue.increment(1) } }, { merge: true }).catch(() => {});

    await adminDb!.collection('admin_actions').add({
      type: 'partner_payout', performedBy: staff.uid, referralId: String(referralId), targetUid: r.partnerUid,
      amount: payoutAmount, courseFee: fee, commissionPercent: pct,
      description: `Commission payout ${payoutAmount} to partner ${r.partnerUid} for ${r.studentName ?? 'student'}`,
      timestamp: new Date(),
    }).catch(() => {});

    const html = renderPartnerPayoutEmail({
      partnerName: String(partner.fullName ?? 'Partner'),
      studentName: String(r.studentName ?? 'your student'),
      courseName: (courseName ?? '').trim() || undefined,
      courseFee: fee, commissionPercent: pct, payoutAmount, note: (note ?? '').trim() || undefined,
    });

    // Email the partner, copy to contact@ (both awaited — serverless kills fire-and-forget).
    let emailed = true;
    try {
      await sendMail({ to: String(partner.email), replyTo: CONTACT, subject: `Your Smart Labs referral commission — ${r.studentName ?? 'student'}`, html });
      await sendMail({ to: CONTACT, subject: `[Copy] Partner payout — ${partner.fullName ?? ''} · ${payoutAmount}`, html });
    } catch (e) { emailed = false; console.error('[partners/payout] email failed:', e); }

    return NextResponse.json({ success: true, payoutAmount, emailed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/payout] error:', error);
    return NextResponse.json({ error: `Could not send payout: ${msg}` }, { status: 500 });
  }
}
