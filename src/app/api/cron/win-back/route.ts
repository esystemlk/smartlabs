import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { renderWinBackEmail } from '@/lib/email/win-back-email';
import { unsubscribeUrl } from '@/lib/email/unsubscribe';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DAY = 86400000;
const CONTACT = 'contact@smartlabs.lk';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk';
const DASH = `${APP_URL}/dashboard`;

const INACTIVE_DAYS = 60;      // target students idle this long
const RESEND_GUARD_MS = 60 * DAY; // don't win-back the same person again within 60 days
const READ_LIMIT = 300;        // users scanned per run (reads are cheap)
const SEND_CAP = 100;          // emails per run — stays well under Gmail's ~500/day
const STAFF = ['admin', 'developer', 'teacher'];
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Daily win-back: email students who haven't signed in for 60+ days, once per
 * inactivity episode. Ordered by most-recently-churned first, so students who
 * have just crossed the 60-day mark are reached first each day. Opted-out users
 * and staff are skipped; every email carries an unsubscribe link. Sends are
 * capped per run and paced to respect the Gmail transport's daily limit.
 *
 * Runs via Vercel Cron (see vercel.json). Pass ?dry=1 (with the cron secret) to
 * count how many would be emailed without sending.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const dry = new URL(request.url).searchParams.get('dry') === '1';
  const now = Date.now();
  const cutoff = new Date(now - INACTIVE_DAYS * DAY);
  const toDate = (v: unknown) => (v as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

  let scanned = 0, eligible = 0, sent = 0, skipped = 0, failed = 0;

  try {
    const snap = await adminDb.collection('users')
      .where('lastLogin', '<', cutoff)
      .orderBy('lastLogin', 'desc')
      .limit(READ_LIMIT)
      .get();

    for (const doc of snap.docs) {
      scanned++;
      const u = doc.data() as { email?: string; displayName?: string; role?: string; emailOptOut?: boolean; winBackSentAt?: unknown; lastLogin?: unknown };
      if (!u.email || u.emailOptOut || STAFF.includes(u.role ?? '')) { skipped++; continue; }
      const lastWin = toDate(u.winBackSentAt)?.getTime() ?? 0;
      if (now - lastWin < RESEND_GUARD_MS) { skipped++; continue; } // already won-back recently

      eligible++;
      if (dry) continue;
      if (sent >= SEND_CAP) break; // leave the rest for the next daily run

      const last = toDate(u.lastLogin);
      const daysAway = last ? Math.round((now - last.getTime()) / DAY) : undefined;
      try {
        await sendMail({
          to: u.email, replyTo: CONTACT,
          subject: 'We miss you at Smart Labs 👋 — your practice is waiting',
          html: renderWinBackEmail({ fullName: u.displayName || 'there', dashboardUrl: DASH, daysAway, unsubscribeUrl: unsubscribeUrl(doc.id, APP_URL) }),
        });
        await doc.ref.set({ winBackSentAt: FieldValue.serverTimestamp() }, { merge: true });
        sent++;
        await sleep(200);
      } catch (e) { failed++; console.error('[cron/win-back] send failed for', doc.id, e); }
    }

    return NextResponse.json({ ok: true, dry, inactiveDays: INACTIVE_DAYS, scanned, eligible, sent, skipped, failed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/win-back] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
