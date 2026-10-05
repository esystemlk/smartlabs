import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));
const BLOCKED = ['suspended', 'deactivated', 'banned', 'closed'];

/**
 * Staff verify a partner's email on their behalf (when the partner can't or
 * hasn't clicked the verification link) and grant system access directly.
 *
 * - Marks the Firebase Auth email as verified (Admin SDK).
 * - If the partner is already approved and not in a blocked state, flips the
 *   account to `active` so they get full workspace access on next sign-in.
 * - Mirrors emailVerified onto the partner + application docs so the admin UI
 *   and the referral gate reflect it.
 */
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

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { uid } = (await request.json()) as { uid?: string };
    if (!uid) return NextResponse.json({ error: 'A partner uid is required.' }, { status: 400 });

    const partnerRef = adminDb!.collection('partners').doc(uid);
    const snap = await partnerRef.get();
    if (!snap.exists) return NextResponse.json({ error: 'Partner not found.' }, { status: 404 });
    const partner = snap.data() as { email?: string; fullName?: string; ref?: string; reviewStatus?: string; accountState?: string };

    // Mark the email verified in Firebase Auth (the real gate for the workspace).
    await adminAuth!.updateUser(uid, { emailVerified: true });

    // Grant access directly when the partner is approved and not blocked.
    const state = partner.accountState ?? 'pending_activation';
    const activate = partner.reviewStatus === 'approved' && !BLOCKED.includes(state);
    const newState = activate ? 'active' : state;

    const now = FieldValue.serverTimestamp();
    await partnerRef.set({ emailVerified: true, accountState: newState, updatedAt: now }, { merge: true });

    // Keep the application record's snapshot in step (admin list reads it).
    if (partner.ref) {
      await adminDb!.collection('partner_applications').doc(partner.ref)
        .set({ emailVerified: true, updatedAt: now }, { merge: true }).catch(() => { /* best-effort */ });
    }

    await adminDb!.collection('admin_actions').add({
      type: 'partner_verify_email', performedBy: staff.uid, targetUid: uid,
      description: `Partner ${uid} email verified by staff${activate ? ' → active' : ''}`,
      timestamp: new Date(),
    }).catch(() => { /* audit is best-effort */ });

    // Let the partner know they can sign in now (awaited — serverless kills fire-and-forget).
    if (partner.email) {
      try {
        await sendMail({
          to: partner.email, replyTo: CONTACT,
          subject: 'Your SmartLabs partner email is verified',
          html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
            <h2 style="color:#163C69">Hi ${esc(partner.fullName || 'there')}</h2>
            <p>Our team has <b>verified your email</b> for you.${activate ? ' Your partner account is now <b>active</b> — sign in to access your workspace and referral tools.' : ' You can sign in to your partner account.'}</p>
            <p style="margin-top:16px"><a href="${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk')}/partners/login">Sign in to your partner account →</a></p>
            <p style="color:#64748b;font-size:12px;margin-top:20px">If you were already signed in, please sign out and back in to refresh your access. Questions? Reply to this email — it reaches ${CONTACT}.</p>
          </div>`,
        });
      } catch (e) { console.error('[partners/verify-email] email failed:', e); }
    }

    return NextResponse.json({ success: true, emailVerified: true, accountState: newState, activated: activate });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/verify-email] error:', error);
    return NextResponse.json({ error: `Could not verify: ${msg}` }, { status: 500 });
  }
}
