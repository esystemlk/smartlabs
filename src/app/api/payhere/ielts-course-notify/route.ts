import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { renderIeltsReceiptEmail } from '@/lib/ielts-receipt-email';
import { renderAdminPaymentAlert } from '@/lib/admin-payment-email';
import { phoneKey } from '@/lib/utils';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();
const ADMIN_ALERT = 'contact@smartlabs.lk';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) { console.error('[ielts-notify] secret missing'); return new Response('OK', { status: 200 }); }

    const localSig = md5(
      String(merchant_id) + String(order_id) + String(payhere_amount) +
      String(payhere_currency) + String(status_code) + md5(merchantSecret)
    );
    if (localSig !== String(md5sig).toUpperCase()) { console.warn(`[ielts-notify] MD5 mismatch ${order_id}`); return new Response('OK', { status: 200 }); }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb.collection('payment_orders')
      .where('orderId', '==', String(order_id)).where('type', '==', 'ielts_course').limit(1).get();
    if (ordersSnap.empty) { console.warn(`[ielts-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    if (orderData.paymentStatus === 'success') return new Response('OK', { status: 200 });

    const sc = String(status_code);
    const expected = Number(orderData.paymentAmount);
    const paid = Number(payhere_amount);
    if (sc === '2' && Number.isFinite(expected) && Number.isFinite(paid) && paid < expected - 0.5) {
      console.error(`[ielts-notify] UNDERPAYMENT order=${order_id} expected=${expected} paid=${paid}`);
      await orderDoc.ref.update({ paymentStatus: 'amount_mismatch', amountPaid: paid, updatedAt: FieldValue.serverTimestamp() });
      return new Response('OK', { status: 200 });
    }

    if (sc === '2') {
      const enrollmentRef = adminDb.collection('ielts_course_enrollments').doc(String(order_id));
      const userEnrollRef = adminDb.collection('users').doc(String(orderData.userId)).collection('enrollments').doc(String(order_id));

      await adminDb.runTransaction(async (tx) => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return; // idempotent

        tx.update(orderDoc.ref, { paymentStatus: 'success', payherePaymentId: String(payment_id), updatedAt: FieldValue.serverTimestamp() });

        tx.set(enrollmentRef, {
          orderId: String(order_id),
          userId: orderData.userId,
          course: 'IELTS Course',
          packageId: orderData.packageId ?? 'ielts-foundation',
          fullName: orderData.fullName ?? '',
          phone: orderData.phone ?? '',
          phoneKey: phoneKey(orderData.phone),
          email: orderData.email ?? '',
          amountPaid: paid,
          payherePaymentId: String(payment_id),
          batchStatus: 'awaiting_batch',
          batchName: '',
          status: 'active',
          createdAt: FieldValue.serverTimestamp(),
        });

        // Mirror into the student's own enrollments so it shows on their dashboard.
        tx.set(userEnrollRef, {
          orderId: String(order_id),
          course: 'IELTS Course',
          type: 'ielts_course',
          amountPaid: paid,
          batchStatus: 'awaiting_batch',
          batchName: '',
          status: 'active',
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      console.log(`[ielts-notify] ✅ enrolled user=${orderData.userId} order=${order_id}`);

      // Student receipt (best-effort).
      try {
        if (orderData.email) {
          await sendMail({
            to: String(orderData.email),
            subject: 'Payment Receipt — IELTS Course | Smart Labs',
            html: renderIeltsReceiptEmail({
              fullName: String(orderData.fullName ?? 'Student'),
              amount: paid, orderId: String(order_id), paymentId: String(payment_id), phone: String(orderData.phone ?? ''),
            }),
          });
        }
      } catch (e) { console.error('[ielts-notify] receipt email failed:', e); }

      // Admin alert (best-effort).
      try {
        await sendMail({
          to: ADMIN_ALERT,
          subject: `New IELTS enrolment — ${orderData.fullName ?? 'Student'} (${paid})`,
          html: renderAdminPaymentAlert({
            course: 'IELTS Course', amount: paid,
            fullName: String(orderData.fullName ?? ''), phone: String(orderData.phone ?? ''), email: String(orderData.email ?? ''),
            orderId: String(order_id), paymentId: String(payment_id),
          }),
        });
      } catch (e) { console.error('[ielts-notify] admin alert failed:', e); }
    } else {
      await orderDoc.ref.update({ paymentStatus: 'failed', statusCode: sc, updatedAt: FieldValue.serverTimestamp() });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[ielts-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
