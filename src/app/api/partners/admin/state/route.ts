import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

type Action = 'suspend' | 'deactivate' | 'reactivate' | 'ban';
const NEXT_STATE: Record<Action, string> = { suspend: 'suspended', deactivate: 'deactivated', reactivate: 'active', ban: 'banned' };
// deactivate + ban block sign-in entirely (Firebase Auth disabled). Suspend keeps a read-only login.
const AUTH_DISABLED: Record<Action, boolean> = { suspend: false, deactivate: true, reactivate: false, ban: true };

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

const MESSAGES: Record<Action, { subject: string; body: string }> = {
  suspend: { subject: 'Your SmartLabs partner account is under review', body: 'Your partner account has been temporarily <b>suspended</b> while we review it. You can still sign in to see your status, but referral tools are paused.' },
  deactivate: { subject: 'Your SmartLabs partner account has been deactivated', body: 'Your partner account has been <b>temporarily deactivated</b>. You will not be able to sign in until it is reactivated.' },
  reactivate: { subject: 'Your SmartLabs partner account is active again', body: 'Good news — your partner account has been <b>reactivated</b>. You can sign in and use your referral tools again.' },
  ban: { subject: 'Your SmartLabs partner account has been closed', body: 'Your partner account has been <b>permanently closed</b> and access has been removed. If you believe this is a mistake, contact us.' },
};

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { uid, action, reason } = (await request.json()) as { uid?: string; action?: Action; reason?: string };
    if (!uid || !action || !(action in NEXT_STATE)) return NextResponse.json({ error: 'uid and a valid action are required.' }, { status: 400 });
    if ((action === 'suspend' || action === 'deactivate' || action === 'ban') && !(reason ?? '').trim()) {
      return NextResponse.json({ error: 'A reason is required.' }, { status: 400 });
    }

    const partnerRef = adminDb!.collection('partners').doc(uid);
    const snap = await partnerRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Partner not found.' }, { status: 404 });
    const partner = snap.data() as { email?: string; fullName?: string; referralCode?: string };
    const newState = NEXT_STATE[action];
    const now = FieldValue.serverTimestamp();

    // Flip the real kill switch first — if this fails we don't record a false state.
    try { await adminAuth!.updateUser(uid, { disabled: AUTH_DISABLED[action] }); }
    catch (e) { console.error('[partners/state] updateUser failed:', e); }

    await adminDb!.runTransaction(async (tx) => {
      tx.update(partnerRef, {
        accountState: newState,
        stateReason: (reason ?? '').trim() || null,
        stateChangedBy: staff.uid,
        stateChangedAt: now,
        updatedAt: now,
      });
      // Pause/resume the referral code if one has been assigned (Step 2).
      if (partner.referralCode) {
        tx.set(adminDb!.collection('partner_codes').doc(partner.referralCode),
          { uid, active: newState === 'active' }, { merge: true });
      }
    });

    await adminDb!.collection('admin_actions').add({
      type: 'partner_state', performedBy: staff.uid, targetUid: uid, action,
      reason: (reason ?? '').trim() || null,
      description: `Partner ${uid} → ${newState}`,
      timestamp: new Date(),
    });

    // Notify the partner (awaited — serverless kills fire-and-forget).
    if (partner.email) {
      const m = MESSAGES[action];
      try {
        await sendMail({
          to: partner.email, replyTo: CONTACT, subject: m.subject,
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
            <h2 style="color:#163C69">Hi ${esc(partner.fullName || 'there')}</h2>
            <p>${m.body}</p>
            ${(reason ?? '').trim() && action !== 'reactivate' ? `<p style="margin-top:12px"><b>Reason:</b> ${esc(reason!.trim())}</p>` : ''}
            <p style="color:#64748b;font-size:12px;margin-top:20px">Questions? Reply to this email — it reaches ${CONTACT}.</p>
          </div>`,
        });
      } catch (e) { console.error('[partners/state] email failed:', e); }
    }

    return NextResponse.json({ success: true, accountState: newState });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/state] error:', error);
    return NextResponse.json({ error: `Could not update: ${msg}` }, { status: 500 });
  }
}
