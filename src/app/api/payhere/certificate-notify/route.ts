import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';

// Pinned explicitly: this route needs node crypto (MD5 signature check) and
// firebase-admin, neither of which exist on the edge runtime.
export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData.entries());

    const { merchant_id, order_id, payhere_amount, payhere_currency, status_code, md5sig } = data;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    if (!merchantSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const local_md5sig = md5(
      String(merchant_id) +
      String(order_id) +
      String(payhere_amount) +
      String(payhere_currency) +
      String(status_code) +
      md5(merchantSecret)
    );

    if (local_md5sig !== md5sig) {
      console.warn(`[cert-notify] MD5 mismatch for order ${order_id}`);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Extract requestId from orderId: cert_{requestId}_{timestamp}
    const orderIdStr = String(order_id);
    const parts = orderIdStr.split('_');
    const requestId = parts.length >= 3 ? parts.slice(1, -1).join('_') : null;

    if (!requestId || !adminDb) {
      return new Response('OK', { status: 200 });
    }

    const certRef = adminDb.collection('certificate_requests').doc(requestId);
    const certSnap = await certRef.get();

    if (!certSnap.exists) {
      console.warn(`[cert-notify] Request ${requestId} not found`);
      return new Response('OK', { status: 200 });
    }

    if (status_code === '2') {
      await certRef.update({
        paymentStatus: 'paid',
        paymentOrderId: order_id,
        status: 'pending_verification',
        updatedAt: FieldValue.serverTimestamp(),
      });

      const certData = certSnap.data()!;
      const notificationEmail = process.env.NOTIFICATION_EMAIL || process.env.GMAIL_USER || '';

      // Notify admin
      if (notificationEmail) {
        await sendMail({
          to: notificationEmail,
          subject: `New Certificate Request — ${certData.nameOnCertificate}`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8f9fa;padding:20px;border-radius:8px;">
              <div style="background:#0D1B35;padding:24px;border-radius:8px;margin-bottom:20px;">
                <h1 style="color:#F5D978;margin:0;font-size:22px;">New Certificate Request</h1>
                <p style="color:rgba(255,255,255,0.7);margin:6px 0 0;">Payment confirmed — pending your verification</p>
              </div>
              <div style="background:#fff;padding:20px;border-radius:8px;margin-bottom:16px;border:1px solid #e5e7eb;">
                <table style="width:100%;border-collapse:collapse;">
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%;">Request ID</td><td style="padding:8px 0;font-weight:bold;font-size:13px;">${requestId}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Student Name</td><td style="padding:8px 0;font-weight:bold;font-size:13px;">${certData.nameOnCertificate}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Email</td><td style="padding:8px 0;font-size:13px;">${certData.email}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Certificate Type</td><td style="padding:8px 0;font-size:13px;">${certData.type === 'digital' ? 'Digital PDF (LKR 1,500)' : 'Printed & Signed (LKR 3,500)'}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Identity Type</td><td style="padding:8px 0;font-size:13px;">${certData.identityType === 'nic' ? 'NIC' : 'Passport'}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Country</td><td style="padding:8px 0;font-size:13px;">${certData.country}</td></tr>
                  <tr><td style="padding:8px 0;color:#6b7280;font-size:13px;">Amount Paid</td><td style="padding:8px 0;font-weight:bold;color:#16a34a;font-size:13px;">LKR ${certData.amount.toLocaleString()}</td></tr>
                </table>
              </div>
              <div style="background:#fef3c7;border:1px solid #f59e0b;padding:14px;border-radius:8px;margin-bottom:16px;">
                <p style="margin:0;font-size:13px;color:#92400e;"><strong>Action Required:</strong> Please verify the identity document and approve or reject this request from the Admin Dashboard.</p>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/dashboard/certificates" style="display:inline-block;background:#0D1B35;color:#F5D978;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:14px;">Open Admin Dashboard →</a>
            </div>
          `,
        });
      }

      console.log(`[cert-notify] Certificate request ${requestId} marked as paid and pending verification`);
    } else if (status_code === '-1' || status_code === '-2') {
      await certRef.update({
        paymentStatus: 'pending',
        status: 'pending_payment',
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('[cert-notify] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
