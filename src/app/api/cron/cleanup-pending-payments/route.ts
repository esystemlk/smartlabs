import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const DAY = 86400000;
const PENDING_RETENTION_DAYS = 10;

/**
 * Daily sweep: deletes payment_orders that never completed (anything but
 * 'success') once they're older than 10 days. Successful payments are never
 * touched. Runs via Vercel Cron (see vercel.json).
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get('Authorization');
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const cutoff = new Date(Date.now() - PENDING_RETENTION_DAYS * DAY);
  let scanned = 0, deleted = 0, failed = 0;

  try {
    // 'in' (not an inequality) combines with the createdAt range filter —
    // Firestore disallows a '!=' and a range filter on two different fields.
    const snap = await adminDb.collection('payment_orders')
      .where('paymentStatus', 'in', ['pending', 'failed', 'cancelled', 'amount_mismatch', 'chargedback'])
      .where('createdAt', '<', cutoff)
      .limit(500)
      .get();

    for (const doc of snap.docs) {
      scanned++;
      try {
        await doc.ref.delete();
        deleted++;
      } catch (e) {
        failed++;
        console.error('[cron/cleanup-pending-payments] delete failed for', doc.id, e);
      }
    }

    return NextResponse.json({ ok: true, scanned, deleted, failed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[cron/cleanup-pending-payments] error:', error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
