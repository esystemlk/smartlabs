import { NextRequest } from 'next/server';
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
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) { console.error('[sst-notify] secret missing'); return new Response('OK', { status: 200 }); }

    const localSig = md5(
      String(merchant_id) + String(order_id) + String(payhere_amount) +
      String(payhere_currency) + String(status_code) + md5(merchantSecret)
    );
    if (localSig !== String(md5sig).toUpperCase()) {
      console.warn(`[sst-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 });
    }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', 'sst_credits')
      .limit(1).get();
    if (ordersSnap.empty) { console.warn(`[sst-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

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
      if (packageId === 'sst_unlimited') {
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + 40);
        userUpdates.sstMonthlyExpiry = expiry;
      } else {
        userUpdates.sstPaidCredits = FieldValue.increment(scoringCredits);
      }
      await adminDb.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return;
        tx.update(orderDoc.ref, { paymentStatus: 'success', payherePaymentId: String(payment_id), updatedAt: FieldValue.serverTimestamp() });
        tx.update(userRef, userUpdates);
      });
      console.log(`[sst-notify] ✅ SST credits granted — user=${userId} pkg=${packageId}`);
    } else if (sc === '-1') {
      await orderDoc.ref.update({ paymentStatus: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-3') {
      await orderDoc.ref.update({ paymentStatus: 'chargedback', updatedAt: FieldValue.serverTimestamp() });
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[sst-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
