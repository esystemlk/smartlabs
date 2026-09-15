import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Needs node crypto (MD5 signature) and firebase-admin — not the edge runtime.
export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

/**
 * PayHere webhook for SPEAKING credit purchases. Verifies the merchant
 * signature, then grants the purchased credits on the buyer's `speaking` pool.
 * Fired identically by the web checkout and the mobile PayHere SDK.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    // Verify against BOTH the website and app secrets so payments started from
    // either source validate (PayHere issues a separate secret per domain/app).
    const secrets = [process.env.PAYHERE_MERCHANT_SECRET, process.env.PAYHERE_APP_MERCHANT_SECRET].filter(Boolean) as string[];
    if (secrets.length === 0) { console.error('[speaking-notify] secret missing'); return new Response('OK', { status: 200 }); }
    const want = String(md5sig).toUpperCase();
    const base = String(merchant_id) + String(order_id) + String(payhere_amount) + String(payhere_currency) + String(status_code);
    if (!secrets.some((sec) => md5(base + md5(sec)) === want)) {
      console.warn(`[speaking-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 });
    }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', 'speaking_credits')
      .limit(1).get();
    if (ordersSnap.empty) { console.warn(`[speaking-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    if (orderData.paymentStatus === 'success') return new Response('OK', { status: 200 });

    const { userId, packageId, scoringCredits } = orderData as {
      userId: string; packageId: string; scoringCredits: number;
    };
    const sc = String(status_code);

    if (sc === '2') {
      const userRef = adminDb.collection('users').doc(userId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const userUpdates: Record<string, any> = {};
      if (packageId === 'speaking_unlimited') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 40);
        userUpdates.speakingMonthlyExpiry = expiry;
      } else {
        userUpdates.speakingPaidCredits = FieldValue.increment(scoringCredits);
      }
      await adminDb.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return;
        tx.update(orderDoc.ref, { paymentStatus: 'success', payherePaymentId: String(payment_id), updatedAt: FieldValue.serverTimestamp() });
        tx.update(userRef, userUpdates);
      });
      console.log(`[speaking-notify] ✅ Speaking credits granted — user=${userId} pkg=${packageId}`);
    } else if (sc === '-1') {
      await orderDoc.ref.update({ paymentStatus: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-3') {
      await orderDoc.ref.update({ paymentStatus: 'chargedback', updatedAt: FieldValue.serverTimestamp() });
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[speaking-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
