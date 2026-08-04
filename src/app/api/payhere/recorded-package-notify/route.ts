import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { formatLkr } from '@/types/recorded-package';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());
    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig, payment_id } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) { console.error('[recpkg-notify] secret missing'); return new Response('OK', { status: 200 }); }

    const localSig = md5(
      String(merchant_id) + String(order_id) + String(payhere_amount) +
      String(payhere_currency) + String(status_code) + md5(merchantSecret)
    );
    if (localSig !== String(md5sig).toUpperCase()) {
      console.warn(`[recpkg-notify] MD5 mismatch for order ${order_id}`);
      return new Response('OK', { status: 200 });
    }
    if (!adminDb) return new Response('OK', { status: 200 });

    const ordersSnap = await adminDb
      .collection('payment_orders')
      .where('orderId', '==', String(order_id))
      .where('type', '==', 'recorded_package')
      .limit(1).get();
    if (ordersSnap.empty) { console.warn(`[recpkg-notify] order ${order_id} not found`); return new Response('OK', { status: 200 }); }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    if (orderData.paymentStatus === 'success') return new Response('OK', { status: 200 });

    const sc = String(status_code);
    const expected = Number(orderData.paymentAmount);
    const paid = Number(payhere_amount);

    if (sc === '2' && Number.isFinite(expected) && Number.isFinite(paid) && paid < expected - 0.5) {
      console.error(`[recpkg-notify] UNDERPAYMENT order=${order_id} expected=${expected} paid=${paid}`);
      await orderDoc.ref.update({ paymentStatus: 'amount_mismatch', amountPaid: paid, updatedAt: FieldValue.serverTimestamp() });
      return new Response('OK', { status: 200 });
    }

    if (sc === '2') {
      const { userId, packageId, packageTitle } = orderData as { userId: string; packageId: string; packageTitle: string };
      const accessMonths = Number(orderData.accessMonths) || 1;

      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt);
      expiresAt.setMonth(expiresAt.getMonth() + accessMonths);

      let userEmail: string | null = null;
      let userName: string | null = null;
      try {
        const u = await adminDb.collection('users').doc(userId).get();
        userEmail = (u.data()?.email as string) ?? null;
        userName = (u.data()?.displayName as string) ?? null;
      } catch { /* non-fatal */ }

      // Deterministic id => re-purchasing after expiry refreshes the same row.
      const enrollRef = adminDb.collection('recorded_enrollments').doc(`${userId}_${packageId}`);

      await adminDb.runTransaction(async tx => {
        const fresh = await tx.get(orderDoc.ref);
        if (fresh.data()?.paymentStatus === 'success') return;
        tx.update(orderDoc.ref, {
          paymentStatus: 'success',
          payherePaymentId: String(payment_id),
          updatedAt: FieldValue.serverTimestamp(),
        });
        tx.set(enrollRef, {
          userId,
          userEmail,
          userName,
          packageId,
          packageTitle: packageTitle ?? 'Recorded Package',
          purchasedAt,
          expiresAt,
          status: 'active',
          orderId: String(order_id),
          amountPaid: paid,
        }, { merge: true });
      });
      console.log(`[recpkg-notify] ✅ access granted user=${userId} package=${packageId} until ${expiresAt.toISOString()}`);

      // Receipt email (best-effort).
      try {
        if (userEmail) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? '';
          await sendMail({
            to: userEmail,
            subject: `Payment Receipt — ${packageTitle} | Smart Labs Recorded Sessions`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f4f5f7;padding:24px;">
                <div style="background:#0D1B35;padding:24px;border-radius:12px 12px 0 0;text-align:center;">
                  <h1 style="color:#F5D978;margin:0;font-size:20px;">Smart Labs — Payment Receipt</h1>
                  <p style="color:rgba(255,255,255,0.75);margin:6px 0 0;font-size:13px;">Your recorded sessions are unlocked 🎬</p>
                </div>
                <div style="background:#fff;padding:22px;border:1px solid #e5e7eb;border-top:none;">
                  <p style="font-size:14px;margin:0 0 14px;">Hi <b>${userName ?? 'Student'}</b>, thank you for your purchase.</p>
                  <table style="width:100%;border-collapse:collapse;">
                    <tr><td style="padding:7px 0;color:#6b7280;font-size:13px;">Package</td><td style="padding:7px 0;font-weight:bold;font-size:14px;">${packageTitle}</td></tr>
                    <tr><td style="padding:7px 0;color:#6b7280;font-size:13px;">Amount Paid</td><td style="padding:7px 0;font-weight:bold;color:#16a34a;font-size:14px;">${formatLkr(paid)}</td></tr>
                    <tr><td style="padding:7px 0;color:#6b7280;font-size:13px;">Access Until</td><td style="padding:7px 0;font-size:13px;">${expiresAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</td></tr>
                    <tr><td style="padding:7px 0;color:#6b7280;font-size:13px;">Order ID</td><td style="padding:7px 0;font-size:12px;font-family:monospace;">${order_id}</td></tr>
                  </table>
                  <a href="${appUrl}/dashboard/recorded-sessions/${packageId}" style="display:inline-block;margin-top:16px;background:#4f46e5;color:#fff;padding:11px 22px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Watch Now →</a>
                  <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;margin-top:16px;">
                    <p style="margin:0;color:#b91c1c;font-size:12px;"><b>Non-refundable:</b> This payment is strictly non-refundable under any circumstances.</p>
                  </div>
                </div>
              </div>`,
          });
        }
      } catch (e) { console.error('[recpkg-notify] receipt email failed:', e); }

    } else if (sc === '-1') {
      await orderDoc.ref.update({ paymentStatus: 'cancelled', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-2') {
      await orderDoc.ref.update({ paymentStatus: 'failed', updatedAt: FieldValue.serverTimestamp() });
    } else if (sc === '-3') {
      await orderDoc.ref.update({ paymentStatus: 'chargedback', updatedAt: FieldValue.serverTimestamp() });
    }
    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[recpkg-notify] error:', error);
    return new Response('OK', { status: 200 });
  }
}
