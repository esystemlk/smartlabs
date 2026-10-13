import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

const CONTACT = 'contact@smartlabs.lk';
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

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
    const p = snap.data() as { reviewStatus?: string; accountState?: string; referralCode?: string; fullName?: string; email?: string; username?: string };
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

    // Notify admin with the student + partner details (best-effort; awaited
    // because serverless kills fire-and-forget, non-fatal if it fails).
    try {
      await sendMail({
        to: CONTACT,
        replyTo: p.email || undefined,
        subject: `New partner referral — ${studentName}`,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
          <h3>New student referred by a partner</h3>
          <p><b>Student name:</b> ${esc(studentName)}<br/>
             <b>Student contact:</b> ${esc(studentContact)}<br/>
             ${note ? `<b>Note:</b> ${esc(note)}<br/>` : ''}</p>
          <p style="color:#64748b"><b>Partner:</b> ${esc(p.fullName || p.username || 'Unknown')} (${esc(p.email || '—')})<br/>
             <b>Referral code:</b> ${esc(p.referralCode || 'manual')}<br/>
             <b>Referral ID:</b> ${esc(refDoc.id)}</p>
        </div>`,
      });
    } catch (e) { console.error('[partners/referrals/create] admin email failed:', e); }

    return NextResponse.json({ success: true, id: refDoc.id });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/referrals/create] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
