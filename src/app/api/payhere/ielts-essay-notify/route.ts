import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { IELTS_ESSAY_ORDER_TYPE } from '@/lib/ielts-essay-packages';

// Needs node crypto (MD5 signature) and firebase-admin — not the edge runtime.
export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) { console.error('[ielts-essay-notify] secret missing'); return new Response('OK', { status: 200 }); }

    // ── Verify PayHere signature ──────────────────────────────────────────
    const localSig = md5(
      String(merchant_id) + String(order_id) + String(payhere_amount) +
      String(payhere_currency) + String(status_code) + md5(merchantSecret)
    );
    if (localSig !== String(md5sig).toUpperCase()) {
      console.warn(`[ielts-essay-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 });
    }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', IELTS_ESSAY_ORDER_TYPE)
      .limit(1).get();
    if (ordersSnap.empty) { console.warn(`[ielts-essay-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();

    // Idempotency — PayHere retries the notify several times.
    if (orderData.paymentStatus === 'success') return new Response('OK', { status: 200 });

    const { userId, packageId, scoringCredits, monthlyDays, paymentAmount } = orderData as {
      userId: string; packageId: string; scoringCredits: number; monthlyDays: number | null; paymentAmount: number;
    };
    const sc = String(status_code);

    if (sc === '2') {
      // Defence in depth: reject if the amount paid is less than the order's
      // stored price (the checkout hash already prevents tampering, but this
      // guards against any mismatch before granting credits).
      const paid = Number(payhere_amount);
      if (Number.isFinite(paid) && typeof paymentAmount === 'number' && paid + 0.01 < paymentAmount) {
        console.warn(`[ielts-essay-notify] underpayment: paid ${paid} < ${paymentAmount} for ${order_id}`);
        await orderDoc.ref.update({ paymentStatus: 'amount_mismatch', payherePaymentId: String(payment_id), updatedAt: FieldValue.serverTimestamp() });
        return new Response('OK', { status: 200 });
      }

      const userRef = adminDb.collection('users').doc(userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userUpdates: Record<string, any> = {};
      if (scoringCredits === -1) {
        // Unlimited plan → time-boxed subscription.
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + (monthlyDays ?? 40));
        userUpdates.ieltsEssayMonthlyExpiry = expiry;
      } else {
        userUpdates.ieltsEssayPaidCredits = FieldValue.increment(scoringCredits);
      }

      await adminDb.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return; // concurrent webhook won
        tx.update(orderDoc.ref, {
          paymentStatus: 'success',
          payherePaymentId: String(payment_id),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.update(userRef, userUpdates);
      });
      console.log(`[ielts-essay-notify] ✅ granted — user=${userId} pkg=${packageId}`);
    } else if (sc === '-1') {
      await orderDoc.ref.update({ paymentStatus: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-3') {
      await orderDoc.ref.update({ paymentStatus: 'chargedback', updatedAt: FieldValue.serverTimestamp() });
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[ielts-essay-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
