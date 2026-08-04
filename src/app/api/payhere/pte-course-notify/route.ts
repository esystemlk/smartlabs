import { NextRequest } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { getPtePackage, formatLkr, type PtePackage } from '@/lib/pte-packages';

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
            html: receiptHtml({
              pkg,
              orderId: String(order_id),
              paymentId: String(payment_id),
              amount: paid,
              fullName: String(orderData.fullName ?? 'Student'),
              batchName: String(orderData.batchName ?? ''),
              phone: String(orderData.phone ?? ''),
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

// ─── Receipt email template ────────────────────────────────────────────────
function receiptHtml(o: {
  pkg: PtePackage; orderId: string; paymentId: string; amount: number;
  fullName: string; batchName: string; phone: string;
}): string {
  const { pkg } = o;
  const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const featureRows = pkg.features
    .map(f => `<li style="margin-bottom:8px;"><b style="color:#0D1B35;">${f.title}</b><br/><span style="color:#6b7280;font-size:13px;">${f.detail}</span></li>`)
    .join('');
  const accessRows = pkg.accessSteps
    .map((s, i) => `<tr><td style="padding:6px 10px 6px 0;color:#4f46e5;font-weight:bold;vertical-align:top;">${i + 1}.</td><td style="padding:6px 0;color:#374151;font-size:13px;">${s}</td></tr>`)
    .join('');

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:640px;margin:0 auto;background:#f4f5f7;padding:24px;">
    <div style="background:#0D1B35;padding:28px 24px;border-radius:12px 12px 0 0;text-align:center;">
      <h1 style="color:#F5D978;margin:0;font-size:22px;">Smart Labs — Payment Receipt</h1>
      <p style="color:rgba(255,255,255,0.75);margin:8px 0 0;font-size:14px;">Your PTE registration is confirmed 🎉</p>
    </div>

    <div style="background:#fff;padding:24px;border:1px solid #e5e7eb;border-top:none;">
      <p style="font-size:15px;margin:0 0 16px;">Hi <b>${o.fullName}</b>, thank you for enrolling with Smart Labs. Here is your receipt.</p>

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:42%;">Course Package</td><td style="padding:8px 0;font-weight:bold;font-size:14px;">${pkg.name}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Batch</td><td style="padding:8px 0;font-weight:bold;font-size:14px;">${o.batchName || '—'}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Amount Paid</td><td style="padding:8px 0;font-weight:bold;color:#16a34a;font-size:14px;">${formatLkr(o.amount)}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Payment Date</td><td style="padding:8px 0;font-size:13px;">${date}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Order ID</td><td style="padding:8px 0;font-size:13px;font-family:monospace;">${o.orderId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">PayHere Payment ID</td><td style="padding:8px 0;font-size:13px;font-family:monospace;">${o.paymentId}</td></tr>
        <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Contact Number</td><td style="padding:8px 0;font-size:13px;">${o.phone}</td></tr>
      </table>

      <h3 style="margin:0 0 10px;color:#0D1B35;font-size:16px;">What your ${pkg.name} package unlocks</h3>
      <ul style="margin:0 0 20px;padding-left:18px;">${featureRows}</ul>

      <div style="background:#eef2ff;border:1px solid #c7d2fe;border-radius:10px;padding:16px;margin-bottom:20px;">
        <h3 style="margin:0 0 10px;color:#3730a3;font-size:15px;">How to get your access</h3>
        <table style="width:100%;border-collapse:collapse;">${accessRows}</table>
      </div>

      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:14px;margin-bottom:8px;">
        <p style="margin:0;color:#b91c1c;font-size:13px;"><b>Non-refundable payment:</b> This programme fee is strictly non-refundable under any circumstances.</p>
      </div>
    </div>

    <div style="background:#0D1B35;padding:18px 24px;border-radius:0 0 12px 12px;text-align:center;">
      <p style="color:rgba(255,255,255,0.75);margin:0;font-size:12px;">Need help? Call 077 453 3233 · smartlabs.lk · Rajagiriya & Wattala</p>
    </div>
  </div>`;
}
