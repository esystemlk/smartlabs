import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { MOCK_PACKAGES } from '@/lib/mock-credits';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const { packageId } = await request.json();
    const pkg = MOCK_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const merchantId     = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const appUrl         = process.env.NEXT_PUBLIC_APP_URL;
    if (!merchantId || !merchantSecret || !appUrl) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data() ?? {};
    const displayName: string = (userData.displayName as string) || 'Student';
    const email: string = (userData.email as string) || (decoded.email ?? '') || 'noreply@smartlabs.lk';
    const nameParts = displayName.trim().split(' ');

    const orderId = `mock_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = pkg.price.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'mock_credits',
      packageId: pkg.id,
      mockCredits: pkg.credits,
      paymentAmount: pkg.price,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params = {
      merchant_id: merchantId,
      return_url:  `${appUrl}/mock-tests?payment=success&pkg=${pkg.id}`,
      cancel_url:  `${appUrl}/mock-tests?payment=cancelled`,
      notify_url:  `${appUrl}/api/payhere/mock-notify`,
      order_id:    orderId,
      items:       `SmartLabs PTE Mock Test — ${pkg.label}`,
      amount,
      currency,
      first_name:  nameParts[0] || 'Student',
      last_name:   nameParts.slice(1).join(' ') || '-',
      email,
      phone:       '0000000000',
      address:     'N/A',
      city:        'Colombo',
      country:     'Sri Lanka',
      hash,
    };

    return NextResponse.json({ success: true, params, orderId });
  } catch (error) {
    console.error('[mock-credits/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
