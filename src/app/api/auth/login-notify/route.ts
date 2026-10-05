import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { renderWelcomeNewUserEmail } from '@/lib/email/welcome-new-user-email';
import { renderWelcomeBackEmail } from '@/lib/email/welcome-back-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk';
const DASH = `${APP_URL}/dashboard`;
const WELCOME_BACK_THROTTLE_MS = 24 * 60 * 60 * 1000; // at most once per day

/**
 * Called by the client right after a user signs in. Sends — at most one email:
 *  - a one-time colourful WELCOME email on the user's first ever sign-in, or
 *  - a WELCOME-BACK email for returning users, throttled to once per 24h.
 * Both are skipped if the user has opted out of emails. Idempotent and safe to
 * call on every session; state is tracked on the user doc.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb || !adminAuth) return NextResponse.json({ ok: false, reason: 'not_configured' });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ ok: false, reason: 'unauthorized' }, { status: 401 });
    let uid: string, tokenName: string | undefined, tokenEmail: string | undefined;
    try { const d = await adminAuth.verifyIdToken(authHeader.slice(7)); uid = d.uid; tokenName = d.name; tokenEmail = d.email; }
    catch { return NextResponse.json({ ok: false, reason: 'bad_token' }, { status: 401 }); }

    const userRef = adminDb.collection('users').doc(uid);
    const snap = await userRef.get();
    const u = (snap.exists ? snap.data() : {}) as {
      email?: string; displayName?: string; emailOptOut?: boolean;
      welcomeEmailSentAt?: { toDate?: () => Date }; lastWelcomeBackAt?: { toDate?: () => Date };
    };
    const email = u.email || tokenEmail;
    const name = (u.displayName || tokenName || 'there').trim();
    if (!email) return NextResponse.json({ ok: false, reason: 'no_email' });

    const now = FieldValue.serverTimestamp();

    // First ever sign-in → one-time congratulations welcome.
    if (!u.welcomeEmailSentAt) {
      await userRef.set({ welcomeEmailSentAt: now, lastWelcomeBackAt: now, updatedAt: now }, { merge: true });
      try {
        await sendMail({
          to: email, replyTo: CONTACT,
          subject: '🎉 Welcome to Smart Labs — your account is ready!',
          html: renderWelcomeNewUserEmail({ fullName: name, dashboardUrl: DASH }),
        });
      } catch (e) { console.error('[login-notify] welcome email failed:', e); }
      return NextResponse.json({ ok: true, sent: 'welcome' });
    }

    // Returning user → welcome-back, but opt-out aware and throttled to once/day.
    if (u.emailOptOut) return NextResponse.json({ ok: true, sent: 'skipped_optout' });
    const last = u.lastWelcomeBackAt?.toDate?.()?.getTime() ?? 0;
    if (Date.now() - last < WELCOME_BACK_THROTTLE_MS) return NextResponse.json({ ok: true, sent: 'skipped_throttle' });

    await userRef.set({ lastWelcomeBackAt: now, updatedAt: now }, { merge: true });
    const signedInAt = new Date().toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });
    try {
      await sendMail({
        to: email, replyTo: CONTACT,
        subject: 'Welcome back to Smart Labs 👋',
        html: renderWelcomeBackEmail({ fullName: name, dashboardUrl: DASH, signedInAt }),
      });
    } catch (e) { console.error('[login-notify] welcome-back email failed:', e); }
    return NextResponse.json({ ok: true, sent: 'welcome_back' });
  } catch (error) {
    console.error('[login-notify] error:', error);
    return NextResponse.json({ ok: false, reason: 'error' }, { status: 500 });
  }
}
