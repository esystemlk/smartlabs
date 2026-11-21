import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { col, mailAll, type Audience } from '@/lib/one-to-one-server';
import { dueReminder, fmtTime, type ReminderKind } from '@/lib/one-to-one';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type B = any;
const timeOf = (b: B) => `${fmtTime(b.startMin)} – ${fmtTime(b.endMin)}`;
const join = (b: B) => b.mode === 'online' ? 'The Zoom link opens in My bookings 30 minutes before the start.' : 'The class address shows in My bookings 30 minutes before the start.';
const lecJoin = (b: B) => b.mode === 'online' ? 'Your Zoom button opens in the lecturer portal 30 minutes before the start.' : 'This is a physical class at SmartLabs.';

const MESSAGES: Record<ReminderKind, (b: B) => { subject: string; heading: string; notes: Record<Audience, string> }> = {
  dayBefore: b => ({
    subject: 'Reminder: one-to-one session tomorrow', heading: 'Your session is tomorrow',
    notes: {
      student: `Hi ${b.studentName}, a reminder that your one-to-one session with ${b.lecturerName} is tomorrow, ${timeOf(b)}. ${join(b)} Need to cancel? Same-day cancellations are not refunded.`,
      lecturer: `Hi ${b.lecturerName}, you have a one-to-one session with ${b.studentName} tomorrow, ${timeOf(b)}. ${lecJoin(b)}`,
      admin: `Session tomorrow, ${timeOf(b)}.`,
    },
  }),
  classDay: b => ({
    subject: 'Today: your one-to-one session', heading: 'Your session is today',
    notes: {
      student: `Good morning ${b.studentName}! Your one-to-one session with ${b.lecturerName} is today, ${timeOf(b)}. ${join(b)}`,
      lecturer: `Good morning ${b.lecturerName}. You teach ${b.studentName} today, ${timeOf(b)}. ${lecJoin(b)}`,
      admin: `Session today, ${timeOf(b)}.`,
    },
  }),
  hourBefore: b => ({
    subject: 'Starting in 1 hour: one-to-one session', heading: 'Your session starts in 1 hour',
    notes: {
      student: `Hi ${b.studentName}, your session with ${b.lecturerName} starts in about 1 hour (${fmtTime(b.startMin)}). ${join(b)}`,
      lecturer: `Hi ${b.lecturerName}, your session with ${b.studentName} starts in about 1 hour (${fmtTime(b.startMin)}). ${lecJoin(b)}`,
      admin: `Session starts in about 1 hour (${fmtTime(b.startMin)}).`,
    },
  }),
  starting: b => ({
    subject: 'Starting now: one-to-one session', heading: 'Your session is starting',
    notes: {
      student: `Hi ${b.studentName}, your session with ${b.lecturerName} is starting now (${fmtTime(b.startMin)}). ${b.mode === 'online' ? 'Open My bookings and press “Join Zoom session”.' : 'Please make your way to the class.'}`,
      lecturer: `Hi ${b.lecturerName}, your session with ${b.studentName} is starting now (${fmtTime(b.startMin)}). ${b.mode === 'online' ? 'Open the lecturer portal and press “Join Zoom session”.' : ''}`,
      admin: `Session starting now (${fmtTime(b.startMin)}). After it ends, confirm it in Admin → One-to-One → Confirm sessions.`,
    },
  }),
};

/**
 * Sends one-to-one reminders (evening before, class-day morning, 1 hour before, at start)
 * to the student, lecturer and admin. Safe to call as often as you like: each reminder is
 * claimed in a transaction before sending, so it goes out once.
 * Triggered by Vercel Cron (daily backups) and an external pinger every 10 minutes.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const now = Date.now();
  const snap = await col.bookings().where('status', '==', 'confirmed').get();
  const candidates = snap.docs.filter(d => d.data().endAt > now && d.data().startAt - now < 2 * 86_400_000);
  const sent: string[] = [];
  let skipped = 0, failed = 0;

  for (const doc of candidates) {
    try {
      const claimed = await adminDb.runTransaction(async tx => {
        const fresh = await tx.get(doc.ref);
        const b = fresh.data();
        if (!b || b.status !== 'confirmed') return null;
        const done = b.reminders ?? {};
        const { send, skip } = dueReminder(b as { date: string; startAt: number; endAt: number; paidAt?: number }, done, Date.now());
        if (!send && !skip.length) return null;
        const update: Record<string, number | string> = {};
        for (const k of skip) update[`reminders.${k}`] = 'skipped';
        if (send) update[`reminders.${send}`] = Date.now();
        tx.update(doc.ref, update);
        skipped += skip.length;
        return send ? { kind: send, b } : null;
      });
      if (!claimed) continue;
      const m = MESSAGES[claimed.kind](claimed.b);
      await mailAll(claimed.b, m.subject, m.heading, m.notes);
      sent.push(`${doc.id}:${claimed.kind}`);
    } catch (e) {
      failed++;
      console.error('[cron/one-to-one-reminders]', doc.id, e);
    }
  }
  return NextResponse.json({ ok: true, checked: candidates.length, sent, skipped, failed });
}
