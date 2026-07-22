import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Pinned explicitly: this route needs node crypto (MD5 signature check) and
// firebase-admin, neither of which exist on the edge runtime.
export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id,
    } = data;

    // ── 1. Verify merchant secret ─────────────────────────────────────────
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) {
      console.error('[essay-notify] Merchant secret missing');
      return new Response('OK', { status: 200 }); // always 200 to PayHere
    }

    // ── 2. Verify MD5 signature ──────────────────────────────────────────
    const local_md5sig = md5(
      String(merchant_id) +
      String(order_id) +
      String(payhere_amount) +
      String(payhere_currency) +
      String(status_code) +
      md5(merchantSecret)
    );

    if (local_md5sig !== String(md5sig).toUpperCase()) {
      console.warn(`[essay-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 }); // don't 400 — PayHere will retry
    }

    if (!adminDb) {
      console.error('[essay-notify] adminDb not initialized');
      return new Response('OK', { status: 200 });
    }

    // ── 3. Find the pending order ─────────────────────────────────────────
    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', 'essay_credits')
      .limit(1)
      .get();

    if (ordersSnap.empty) {
      console.warn(`[essay-notify] Order ${order_id} not found`);
      return new Response('OK', { status: 200 });
    }

    const orderDoc  = ordersSnap.docs[0];
    const orderData = orderDoc.data();

    // ── 4. IDEMPOTENCY GUARD — skip if already processed ─────────────────
    // PayHere retries notify several times. We must not grant credits twice.
    if (orderData.paymentStatus === 'success') {
      console.log(`[essay-notify] Order ${order_id} already processed — skipping`);
      return new Response('OK', { status: 200 });
    }

    const {
      userId,
      packageId,
      scoringCredits,
      genCredits,
    } = orderData as {
      userId:         string;
      packageId:      string;
      scoringCredits: number;
      genCredits:     number;
    };

    // ── 5. Handle payment result ──────────────────────────────────────────
    const sc = String(status_code);

    if (sc === '2') {
      // Payment SUCCESS — grant credits inside a transaction for atomicity
      const userRef = adminDb.collection('users').doc(userId);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userUpdates: Record<string, any> = {
        essayGenCredits: FieldValue.increment(genCredits),
      };

      if (packageId === 'essay_unlimited') {
        // Unlimited scoring plan: set 40-day expiry
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 40);
        userUpdates.essayMonthlyExpiry = expiry;
        // genCredits (300) already added above via increment
      } else {
        // Regular pack: add paid scoring credits
        userUpdates.essayPaidCredits = FieldValue.increment(scoringCredits);
      }

      await adminDb.runTransaction(async tx => {
        // Re-read the order inside transaction to prevent race conditions
        const freshOrder = await tx.get(orderDoc.ref);
        if (freshOrder.data()?.paymentStatus === 'success') {
          // Another concurrent webhook already processed this — abort
          return;
        }

        tx.update(orderDoc.ref, {
          paymentStatus:    'success',
          payherePaymentId: String(payment_id),
          updatedAt:        FieldValue.serverTimestamp(),
        });
        tx.update(userRef, userUpdates);
      });

      console.log(
        `[essay-notify] ✅ Credits granted — user=${userId} pkg=${packageId}` +
        ` scoring=+${scoringCredits} gen=+${genCredits}`
      );

    } else if (sc === '-1') {
      // Payment CANCELLED by user
      await orderDoc.ref.update({
        paymentStatus: 'cancelled',
        updatedAt:     FieldValue.serverTimestamp(),
      });
      console.log(`[essay-notify] ❌ Payment cancelled — order=${order_id}`);

    } else if (sc === '-2') {
      // Payment FAILED (e.g. card declined)
      await orderDoc.ref.update({
        paymentStatus: 'failed',
        updatedAt:     FieldValue.serverTimestamp(),
      });
      console.log(`[essay-notify] ❌ Payment failed — order=${order_id}`);

    } else if (sc === '-3') {
      // Payment CHARGED BACK
      await orderDoc.ref.update({
        paymentStatus: 'chargedback',
        updatedAt:     FieldValue.serverTimestamp(),
      });
      console.log(`[essay-notify] ⚠️ Chargeback — order=${order_id}`);
    }

    // PayHere requires plain "OK" 200 response — never return 4xx/5xx
    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('[essay-notify] Unhandled error:', error);
    // Still return 200 so PayHere doesn't keep retrying for server errors
    return new Response('OK', { status: 200 });
  }
}
