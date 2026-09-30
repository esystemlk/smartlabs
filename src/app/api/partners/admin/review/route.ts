import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';
const esc = (s: string) => String(s).replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string));

type Action = 'approve' | 'reject' | 'request_info' | 'withdraw';
const NEXT_STATUS: Record<Action, string> = { approve: 'approved', reject: 'rejected', request_info: 'needs_info', withdraw: 'withdrawn' };

async function requireStaff(request: Request): Promise<{ uid: string; email: string | null } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let uid: string, email: string | null = null;
  try { const d = await adminAuth.verifyIdToken(authHeader.slice(7)); uid = d.uid; email = d.email ?? null; }
  catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
  if (!['admin', 'developer', 'teacher'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return { uid, email };
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { ref, action, reason } = (await request.json()) as { ref?: string; action?: Action; reason?: string };
    if (!ref || !action || !(action in NEXT_STATUS)) return NextResponse.json({ error: 'ref and a valid action are required.' }, { status: 400 });
    if ((action === 'reject' || action === 'request_info') && !(reason ?? '').trim()) {
      return NextResponse.json({ error: 'A reason is required for reject / request info.' }, { status: 400 });
    }

    const appRef = adminDb!.collection('partner_applications').doc(ref);
    const appSnap = await appRef.get();
    if (!appSnap.exists) return NextResponse.json({ error: 'Application not found.' }, { status: 404 });
    const app = appSnap.data() as { uid: string; email: string; fullName: string };
    const uid = app.uid;
    const newStatus = NEXT_STATUS[action];

    // Activation stays blocked until the email is verified.
    let emailVerified = false;
    try { emailVerified = (await adminAuth!.getUser(uid)).emailVerified; } catch { /* ignore */ }
    const accountState = action === 'approve' ? (emailVerified ? 'active' : 'pending_activation')
      : action === 'reject' ? 'closed' : action === 'withdraw' ? 'closed' : 'pending_activation';

    const now = FieldValue.serverTimestamp();
    const patch = { reviewStatus: newStatus, reviewReason: (reason ?? '').trim() || null, reviewedBy: staff.uid, reviewedAt: now, updatedAt: now };
    await adminDb!.runTransaction(async (tx) => {
      const fresh = await tx.get(appRef);
      if ((fresh.data()?.reviewStatus as string) === newStatus) return; // idempotent / no conflicting double-decision
      tx.update(appRef, patch);
      tx.update(adminDb!.collection('partners').doc(uid), { reviewStatus: newStatus, accountState, updatedAt: now });
    });

    // Audit log (survives even if the email later fails).
    await adminDb!.collection('admin_actions').add({
      type: 'partner_review', performedBy: staff.uid, targetUid: uid, ref, action,
      reason: (reason ?? '').trim() || null,
      description: `Partner application ${ref} → ${newStatus}`,
      timestamp: new Date(),
    });

    // Notify the applicant (awaited — serverless kills fire-and-forget).
    const messages: Record<Action, { subject: string; body: string }> = {
      approve: { subject: `Your SmartLabs partnership is approved — ${ref}`, body: `Good news — your partnership has been approved.${emailVerified ? ' Sign in to your workspace to get started.' : ' Please verify your email, then sign in to activate referrals.'}` },
      reject: { subject: `Update on your SmartLabs partner application — ${ref}`, body: `After review, we're unable to approve your application at this time.${reason ? `<br/><br/><b>Reason:</b> ${esc(reason)}` : ''}` },
      request_info: { subject: `Action needed on your SmartLabs partner application — ${ref}`, body: `We need a little more information before we can proceed.${reason ? `<br/><br/><b>What we need:</b> ${esc(reason)}` : ''}<br/><br/>Please reply to this email or sign in to update your details.` },
      withdraw: { subject: `Your SmartLabs partner application was withdrawn — ${ref}`, body: `Your application has been marked as withdrawn.` },
    };
    const m = messages[action];
    try {
      await sendMail({
        to: app.email, replyTo: CONTACT, subject: m.subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f172a">
          <h2 style="color:#163C69">Hi ${esc(app.fullName || 'there')}</h2>
          <p>${m.body}</p>
          <p style="margin-top:16px"><a href="${(process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk')}/partners/login">Sign in to your partner account →</a></p>
          <p style="color:#64748b;font-size:12px;margin-top:20px">Questions? Reply to this email — it reaches ${CONTACT}.</p>
        </div>`,
      });
    } catch (e) { console.error('[partners/review] decision email failed:', e); }

    return NextResponse.json({ success: true, reviewStatus: newStatus, accountState });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/review] error:', error);
    return NextResponse.json({ error: `Could not update: ${msg}` }, { status: 500 });
  }
}
