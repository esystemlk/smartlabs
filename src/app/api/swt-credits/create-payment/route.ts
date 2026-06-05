import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export const SWT_PACKAGES = [
  { id: 'swt_10',        scoring: 10,  price: 1500,  label: '10 Scorings' },
  { id: 'swt_40',        scoring: 40,  price: 3500,  label: '40 Scorings' },
  { id: 'swt_100',       scoring: 100, price: 6000,  label: '100 Scorings' },
  { id: 'swt_unlimited', scoring: -1,  price: 15000, label: 'Unlimited' },
] as const;

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
    const pkg = SWT_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const merchantId     = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const appUrl         = process.env.NEXT_PUBLIC_APP_URL;
    if (!merchantId || !merchantSecret || !appUrl) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data() ?? {};
    const displayName: string = (userData.displayName as string) || (userData.name as string) || 'Student';
    const email: string = (userData.email as string) || (decoded.email ?? '') || 'noreply@smartlabs.lk';
    const nameParts = displayName.trim().split(' ');
    const firstName = nameParts[0] || 'Student';
    const lastName  = nameParts.slice(1).join(' ') || '-';

    const orderId = `swt_${uid.slice(0, 8)}_${Date.now()}`;
    const amount  = pkg.price.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'swt_credits',
      packageId: pkg.id,
      scoringCredits: pkg.scoring,
      paymentAmount: pkg.price,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params = {
      merchant_id: merchantId,
      return_url:  `${appUrl}/swt-trainer?payment=success&pkg=${pkg.id}`,
      cancel_url:  `${appUrl}/swt-trainer?payment=cancelled`,
      notify_url:  `${appUrl}/api/payhere/swt-notify`,
      order_id:    orderId,
      items:       `SmartLabs PTE SWT Credits — ${pkg.label}`,
      amount,
      currency,
      first_name:  firstName,
      last_name:   lastName,
      email,
      phone:       '0000000000',
      address:     'N/A',
      city:        'Colombo',
      country:     'Sri Lanka',
      hash,
    };

    return NextResponse.json({ success: true, params, orderId });
  } catch (error) {
    console.error('[swt-credits/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
