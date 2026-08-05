import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Needs firebase-admin — not available on the edge runtime.
export const runtime = 'nodejs';

/**
 * Flip any recorded-session access that is past its expiry from
 * `active` → `expired`. The player already gates on the expiry DATE, so this
 * is defence-in-depth + clean admin reporting, not the primary lock.
 *
 * Runs daily via Vercel Cron (see vercel.json). Vercel attaches
 * `Authorization: Bearer <CRON_SECRET>` when CRON_SECRET is set, which we
 * verify so the endpoint can't be triggered by anyone else.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const now = new Date();
  const result: Record<string, number> = {};

  // Both collections use the same { status: 'active', expiresAt } shape.
  for (const col of ['recorded_enrollments', 'recording_access'] as const) {
    let expired = 0;
    try {
      // Query only active rows, then filter by date in memory — avoids needing
      // a composite (status + expiresAt) index.
      const snap = await adminDb.collection(col).where('status', '==', 'active').get();
      const stale = snap.docs.filter(d => {
        const exp = (d.data().expiresAt as { toDate?: () => Date } | undefined)?.toDate?.();
        return exp && exp <= now;
      });
      // Commit in batches of 400 (Firestore limit is 500 writes/batch).
      for (let i = 0; i < stale.length; i += 400) {
        const batch = adminDb.batch();
        stale.slice(i, i + 400).forEach(d => batch.update(d.ref, { status: 'expired', expiredAt: FieldValue.serverTimestamp() }));
        // eslint-disable-next-line no-await-in-loop
        await batch.commit();
      }
      expired = stale.length;
    } catch (e) {
      console.error(`[expire-recorded-access] ${col} failed:`, e);
    }
    result[col] = expired;
  }

  console.log('[expire-recorded-access]', result);
  return NextResponse.json({ ok: true, expired: result, ranAt: now.toISOString() });
}
