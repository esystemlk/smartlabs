import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { payhereCreds } from '@/lib/payhere-creds';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

/**
 * Universal AI credits — one pool that pays for every AI-scored part
 * (Essay, SWT, SST, all Speaking tasks, IELTS essay). Prices mirror the legacy
 * per-part tiers. The matching `/api/payhere/universal-notify` webhook grants
 * `universalPaidCredits` (or a 40-day `universalMonthlyExpiry` for Unlimited).
 */
const UNIVERSAL_PACKAGES = [
  { id: 'universal_10',        scoring: 10,  price: 1500,  label: '10 AI Credits' },
  { id: 'universal_40',        scoring: 40,  price: 3500,  label: '40 AI Credits' },
  { id: 'universal_100',       scoring: 100, price: 6000,  label: '100 AI Credits' },
  { id: 'universal_unlimited', scoring: -1,  price: 15000, label: 'Unlimited (40 days)' },
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

    const { packageId, client } = await request.json();
    const pkg = UNIVERSAL_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const { merchantId, merchantSecret } = payhereCreds(client);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL;
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

    const orderId = `uni_${uid.slice(0, 8)}_${Date.now()}`;
    const amount  = pkg.price.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'universal_credits',
      packageId: pkg.id,
      scoringCredits: pkg.scoring,
      paymentAmount: pkg.price,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params = {
      merchant_id: merchantId,
      return_url:  `${appUrl}/credits?payment=success&pkg=${pkg.id}`,
      cancel_url:  `${appUrl}/credits?payment=cancelled`,
      notify_url:  `${appUrl}/api/payhere/universal-notify`,
      order_id:    orderId,
      items:       `SmartLabs AI Credits — ${pkg.label}`,
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
    console.error('[universal-credits/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
