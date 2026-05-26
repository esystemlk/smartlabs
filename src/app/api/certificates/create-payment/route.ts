import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth } from '@/lib/firebase-admin';
import { getCertificateRequest } from '@/lib/services/certificate.service';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    if (!adminAuth) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const { requestId } = await request.json();

    if (!requestId) {
      return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
    }

    const certRequest = await getCertificateRequest(requestId);
    if (!certRequest) {
      return NextResponse.json({ error: 'Certificate request not found' }, { status: 404 });
    }

    if (certRequest.userId !== decoded.uid) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (certRequest.paymentStatus === 'paid') {
      return NextResponse.json({ error: 'Already paid' }, { status: 400 });
    }

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;

    if (!merchantId || !merchantSecret || !appUrl) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const orderId = `cert_${requestId}_${Date.now()}`;
    const amount = certRequest.amount.toFixed(2);
    const currency = 'LKR';

    const secretHash = md5(merchantSecret);
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${secretHash}`);

    const nameParts = certRequest.nameOnCertificate.trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '-';

    const params = {
      merchant_id: merchantId,
      return_url: `${appUrl}/dashboard/certificate-request?status=success&ref=${requestId}`,
      cancel_url: `${appUrl}/dashboard/certificate-request?status=cancelled&ref=${requestId}`,
      notify_url: `${appUrl}/api/payhere/certificate-notify`,
      order_id: orderId,
      items: certRequest.type === 'digital'
        ? 'Smart Labs PTE Digital Certificate & Letter'
        : 'Smart Labs PTE Printed Certificate & Letter',
      amount,
      currency,
      first_name: firstName,
      last_name: lastName,
      email: certRequest.email,
      phone: '0000000000',
      address: certRequest.shippingAddress || 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
    };

    return NextResponse.json({ success: true, params, orderId });
  } catch (error) {
    console.error('[certificates/create-payment] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
