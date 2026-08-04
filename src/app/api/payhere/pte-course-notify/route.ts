import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { getPtePackage, formatLkr } from '@/lib/pte-packages';
import { renderPteReceiptEmail } from '@/lib/pte-receipt-email';
import { phoneKey } from '@/lib/utils';

// Needs node crypto (MD5 signature) + firebase-admin — not available on edge.
export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) { console.error('[pte-notify] secret missing'); return new Response('OK', { status: 200 }); }

    const localSig = md5(
      String(merchant_id) + String(order_id) + String(payhere_amount) +
      String(payhere_currency) + String(status_code) + md5(merchantSecret)
    );
    if (localSig !== String(md5sig).toUpperCase()) {
      console.warn(`[pte-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 });
    }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', 'pte_course')
      .limit(1).get();
    if (ordersSnap.empty) { console.warn(`[pte-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    if (orderData.paymentStatus === 'success') return new Response('OK', { status: 200 });

    const sc = String(status_code);

    // Defence in depth: never enrol on an underpayment (hash is server-side, so
    // PayHere already rejects tampered amounts — tolerance covers rounding only).
    const expected = Number(orderData.paymentAmount);
    const paid = Number(payhere_amount);
    if (sc === '2' && Number.isFinite(expected) && Number.isFinite(paid) && paid < expected - 0.5) {
      console.error(`[pte-notify] UNDERPAYMENT order=${order_id} expected=${expected} paid=${paid}`);
      await orderDoc.ref.update({ paymentStatus: 'amount_mismatch', amountPaid: paid, updatedAt: FieldValue.serverTimestamp() });
      return new Response('OK', { status: 200 });
    }

    if (sc === '2') {
      const pkg = getPtePackage(String(orderData.packageId));
      const enrollmentRef = adminDb.collection('pte_course_enrollments').doc(String(order_id));
      const batchRef = orderData.batchId ? adminDb.collection('pte_batches').doc(String(orderData.batchId)) : null;

      // Batch's WhatsApp group link (put in the receipt so the student can
      // request to join — admin approves against the paid list).
      let whatsappLink = '';
      if (batchRef) {
        try { whatsappLink = String((await batchRef.get()).data()?.whatsappLink ?? ''); } catch { /* non-critical */ }
      }

      // Atomic: mark order paid, create the enrollment, take a seat — once.
      await adminDb.runTransaction(async (tx) => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return; // idempotent

        tx.update(orderDoc.ref, {
          paymentStatus: 'success',
          payherePaymentId: String(payment_id),
          updatedAt: FieldValue.serverTimestamp(),
        });

        tx.set(enrollmentRef, {
          orderId: String(order_id),
          userId: orderData.userId,
          packageId: orderData.packageId,
          packageName: orderData.packageName ?? pkg?.name ?? '',
          batchId: orderData.batchId ?? '',
          batchName: orderData.batchName ?? '',
          fullName: orderData.fullName ?? '',
          phone: orderData.phone ?? '',
          phoneKey: phoneKey(orderData.phone),
          email: orderData.email ?? '',
          amountPaid: paid,
          payherePaymentId: String(payment_id),
          status: 'active',
          createdAt: FieldValue.serverTimestamp(),
        });

        if (batchRef) tx.update(batchRef, { seatsFilled: FieldValue.increment(1) });
      });

      console.log(`[pte-notify] ✅ enrolled user=${orderData.userId} pkg=${orderData.packageId} order=${order_id}`);

      // ── Receipt email to the student (best-effort, never blocks the webhook) ──
      try {
        if (orderData.email && pkg) {
          await sendMail({
            to: String(orderData.email),
            subject: `Payment Receipt — ${pkg.name} | Smart Labs PTE`,
            html: renderPteReceiptEmail({
              pkg,
              orderId: String(order_id),
              paymentId: String(payment_id),
              amount: paid,
              fullName: String(orderData.fullName ?? 'Student'),
              batchName: String(orderData.batchName ?? ''),
              phone: String(orderData.phone ?? ''),
              whatsappLink,
            }),
          });
        }
      } catch (e) { console.error('[pte-notify] receipt email failed:', e); }

      // ── Notify admin ──
      try {
        const adminEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || '';
        if (adminEmail) {
          await sendMail({
            to: adminEmail,
            subject: `New PTE Enrollment — ${orderData.fullName} (${orderData.packageName})`,
            html: `<div style="font-family:Arial,sans-serif;font-size:14px;">
              <h2 style="margin:0 0 12px;">New PTE Course Enrollment</h2>
              <p><b>${orderData.fullName}</b> just paid ${formatLkr(paid)} for <b>${orderData.packageName}</b>.</p>
              <p>Batch: <b>${orderData.batchName || '—'}</b><br/>Phone: ${orderData.phone}<br/>Email: ${orderData.email}<br/>Order: ${order_id}</p>
              <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard/pte-batches">Open Batch Manager →</a></p>
            </div>`,
          });
        }
      } catch (e) { console.error('[pte-notify] admin email failed:', e); }

    } else if (sc === '-1') {
      await orderDoc.ref.update({ paymentStatus: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-3') {
      await orderDoc.ref.update({ paymentStatus: 'chargedback', updatedAt: FieldValue.serverTimestamp() });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[pte-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
