import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DAY = 86400000;

/**
 * Email students whose recorded-session access expires within ~7 days, once,
 * with the exact expiry date and a renew link. Uses the same mail transport as
 * all Smart Labs notices. Runs daily via Vercel Cron (see vercel.json).
 *
 * A `reminder7SentAt` flag on the enrollment prevents duplicate reminders.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
  const now = new Date();
  const cutoff = new Date(now.getTime() + 7 * DAY); // expiring within 7 days
  const toDate = (v: unknown) => (v as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;

  let sent = 0, skipped = 0, failed = 0;

  try {
    // Active rows only (no composite index); filter the date window in memory.
    const snap = await adminDb.collection('recorded_enrollments').where('status', '==', 'active').get();
    const due = snap.docs.filter((d) => {
      const data = d.data();
      const exp = toDate(data.expiresAt);
      if (!exp) return false;
      if (exp <= now || exp > cutoff) return false;      // must expire within the next 7 days
      if (data.reminder7SentAt) return false;            // already reminded
      if (!data.userEmail) return false;                 // need an address
      return true;
    });

    // Cap per run to stay within the function time budget; the daily run catches up.
    for (const d of due.slice(0, 60)) {
      const e = d.data();
      const exp = toDate(e.expiresAt)!;
      const daysLeft = Math.max(1, Math.ceil((exp.getTime() - now.getTime()) / DAY));
      const expStr = exp.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const name = (e.userName as string) || 'Student';
      const title = (e.packageTitle as string) || 'Recorded Sessions';
      const watchUrl = `${appUrl}/dashboard/recorded-sessions/${e.packageId}`;

      try {
        // eslint-disable-next-line no-await-in-loop
        await sendMail({
          to: e.userEmail as string,
          subject: `⏳ Your Smart Labs recordings expire on ${expStr} — ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
              <div style="background:#0D1B35;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                <h1 style="color:#F5D978;margin:0;font-size:20px;">Smart Labs — Access Expiring Soon</h1>
                <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Your recorded sessions are about to expire 🎬</p>
              </div>
              <div style="background:#fff;padding:22px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
                <p style="font-size:14px;margin:0 0 14px;">Hi <b>${name}</b>,</p>
                <p style="font-size:14px;margin:0 0 14px;color:#374151;">Your access to <b>${title}</b> will end soon. After the date below, the recordings will be locked automatically.</p>
                <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;text-align:center;margin:16px 0;">
                  <p style="margin:0;color:#9a3412;font-size:13px;">Access ends on</p>
                  <p style="margin:4px 0 0;color:#c2410c;font-size:22px;font-weight:bold;">${expStr}</p>
                  <p style="margin:4px 0 0;color:#9a3412;font-size:12px;">(${daysLeft} day${daysLeft === 1 ? '' : 's'} left)</p>
                </div>
                <p style="font-size:13px;margin:0 0 16px;color:#374151;">Keep watching now, or renew to extend your access.</p>
                <a href="${watchUrl}" style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Watch / Renew →</a>
                <p style="margin:18px 0 0;color:#9ca3af;font-size:12px;">If you already renewed, please ignore this email.</p>
              </div>
              <p style="text-align:center;color:#9ca3af;font-size:11px;margin-top:14px;">Smart Labs · Nugegoda, Sri Lanka</p>
            </div>`,
        });
        // eslint-disable-next-line no-await-in-loop
        await d.ref.update({ reminder7SentAt: FieldValue.serverTimestamp() });
        sent++;
      } catch (err) {
        console.error('[recorded-expiry-reminders] send failed for', d.id, err);
        failed++;
      }
    }
    skipped = due.length - Math.min(due.length, 60);
  } catch (e) {
    console.error('[recorded-expiry-reminders] query failed:', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }

  console.log('[recorded-expiry-reminders]', { sent, failed, skipped });
  return NextResponse.json({ ok: true, sent, failed, skipped, ranAt: now.toISOString() });
}
