import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldPath } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { renderCampaignEmail } from '@/lib/email/campaign-email';
import { unsubscribeUrl } from '@/lib/email/unsubscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const CONTACT = 'contact@smartlabs.lk';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk';
const DASH = `${APP_URL}/dashboard`;
const DEFAULT_SUBJECT = 'New on Smart Labs: fresh IELTS & PTE practice is waiting 🎯';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function requireStaff(request: Request): Promise<{ uid: string; email: string | null } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let uid: string, email: string | null = null;
  try { const d = await adminAuth.verifyIdToken(authHeader.slice(7)); uid = d.uid; email = d.email ?? null; }
  catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
  if (!['admin', 'developer'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return { uid, email };
}

/**
 * Send the re-engagement campaign to registered users. Paged: the admin page
 * calls this repeatedly with the returned cursor so each request sends only a
 * small batch — this avoids serverless timeouts and Gmail's burst limits, and
 * keeps the whole run resumable. Opted-out users are skipped; every email
 * carries a signed unsubscribe link.
 */
export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const body = (await request.json().catch(() => ({}))) as { test?: boolean; startAfter?: string; limit?: number; subject?: string };
    const subject = (body.subject ?? '').trim() || DEFAULT_SUBJECT;

    // Test mode: send a single copy to the admin's own inbox.
    if (body.test) {
      if (!staff.email) return NextResponse.json({ error: 'Your account has no email to send a test to.' }, { status: 400 });
      await sendMail({ to: staff.email, replyTo: CONTACT, subject: `[TEST] ${subject}`, html: renderCampaignEmail({ fullName: 'there', dashboardUrl: DASH, unsubscribeUrl: unsubscribeUrl(staff.uid, APP_URL) }) });
      return NextResponse.json({ test: true, sentTo: staff.email });
    }

    const limit = Math.min(Math.max(body.limit ?? 15, 1), 40);
    let q = adminDb!.collection('users').orderBy(FieldPath.documentId()).limit(limit);
    if (body.startAfter) q = adminDb!.collection('users').orderBy(FieldPath.documentId()).startAfter(body.startAfter).limit(limit);
    const snap = await q.get();

    let sent = 0, skipped = 0, failed = 0;
    for (const doc of snap.docs) {
      const u = doc.data() as { email?: string; displayName?: string; emailOptOut?: boolean };
      if (!u.email || u.emailOptOut) { skipped++; continue; }
      try {
        await sendMail({
          to: u.email, replyTo: CONTACT, subject,
          html: renderCampaignEmail({ fullName: u.displayName || 'there', dashboardUrl: DASH, unsubscribeUrl: unsubscribeUrl(doc.id, APP_URL) }),
        });
        sent++;
        await sleep(200); // be gentle with the mail provider
      } catch (e) { failed++; console.error('[campaign] send failed for', doc.id, e); }
    }

    const done = snap.size < limit;
    const nextCursor = snap.size > 0 ? snap.docs[snap.docs.length - 1].id : null;

    if (done) {
      await adminDb!.collection('admin_actions').add({
        type: 'user_campaign', performedBy: staff.uid, subject,
        description: 'User re-engagement campaign run completed', timestamp: new Date(),
      }).catch(() => { /* best-effort */ });
    }

    return NextResponse.json({ processed: snap.size, sent, skipped, failed, done, nextCursor });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[campaign] error:', error);
    return NextResponse.json({ error: `Could not send: ${msg}` }, { status: 500 });
  }
}
