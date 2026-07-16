import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { ACCESS_DAYS } from '@/types/recording';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) { console.error('[recording-notify] secret missing'); return new Response('OK', { status: 200 }); }

    const localSig = md5(
      String(merchant_id) + String(order_id) + String(payhere_amount) +
      String(payhere_currency) + String(status_code) + md5(merchantSecret)
    );
    if (localSig !== String(md5sig).toUpperCase()) {
      console.warn(`[recording-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 });
    }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', 'class_recording')
      .limit(1).get();
    if (ordersSnap.empty) { console.warn(`[recording-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    if (orderData.paymentStatus === 'success') return new Response('OK', { status: 200 });

    const { userId, recordingId, recordingTitle, paymentAmount } = orderData as {
      userId: string; recordingId: string; recordingTitle: string; paymentAmount: number;
    };
    const sc = String(status_code);

    if (sc === '2') {
      // Access runs for ACCESS_DAYS from the moment payment clears.
      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt);
      expiresAt.setDate(expiresAt.getDate() + ACCESS_DAYS);

      let userEmail: string | null = null;
      let userName: string | null = null;
      try {
        const u = await adminDb.collection('users').doc(userId).get();
        userEmail = (u.data()?.email as string) ?? null;
        userName = (u.data()?.displayName as string) ?? null;
      } catch { /* non-fatal */ }

      // Deterministic id => re-purchasing after expiry refreshes the same row.
      const accessRef = adminDb.collection('recording_access').doc(`${userId}_${recordingId}`);

      await adminDb.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return;
        tx.update(orderDoc.ref, {
          paymentStatus: 'success',
          payherePaymentId: String(payment_id),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(accessRef, {
          userId,
          userEmail,
          userName,
          recordingId,
          recordingTitle: recordingTitle ?? 'Class Recording',
          purchasedAt,
          expiresAt,
          status: 'active',
          orderId: String(order_id),
          amountPaid: paymentAmount ?? null,
        }, { merge: true });
      });
      console.log(`[recording-notify] ✅ access granted — user=${userId} recording=${recordingId} until ${expiresAt.toISOString()}`);
    } else if (sc === '-1') {
      await orderDoc.ref.update({ paymentStatus: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-3') {
      await orderDoc.ref.update({ paymentStatus: 'chargedback', updatedAt: FieldValue.serverTimestamp() });
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[recording-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
