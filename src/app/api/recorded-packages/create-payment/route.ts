import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Please sign in to purchase.' }, { status: 401 });
    }
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const { packageId } = (await request.json()) as { packageId?: string };
    if (!packageId) return NextResponse.json({ error: 'packageId is required' }, { status: 400 });

    const pkgSnap = await adminDb.collection('recorded_packages').doc(packageId).get();
    if (!pkgSnap.exists) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    const pkg = pkgSnap.data()!;
    if (pkg.published === false) return NextResponse.json({ error: 'Package is not available' }, { status: 409 });

    const merchantId     = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const appUrl         = process.env.NEXT_PUBLIC_APP_URL;
    if (!merchantId || !merchantSecret || !appUrl) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const userSnap = await adminDb.collection('users').doc(uid).get();
    const userData = userSnap.data() ?? {};
    const displayName: string = (userData.displayName as string) || decoded.name || 'Student';
    const email: string = (userData.email as string) || (decoded.email ?? '') || 'noreply@smartlabs.lk';
    const nameParts = displayName.trim().split(' ');

    const orderId = `recpkg_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = Number(pkg.price).toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'recorded_package',
      packageId,
      packageTitle: (pkg.title as string) ?? 'Recorded Package',
      accessMonths: Number(pkg.accessMonths) || 1,
      paymentAmount: Number(pkg.price),
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      merchant_id: merchantId,
      return_url:  `${appUrl}/dashboard/recorded-sessions?payment=success`,
      cancel_url:  `${appUrl}/dashboard/recorded-sessions?payment=cancelled`,
      notify_url:  `${appUrl}/api/payhere/recorded-package-notify`,
      order_id:    orderId,
      items:       `Smart Labs Recorded Sessions — ${(pkg.title as string) ?? 'Package'}`,
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
    console.error('[recorded-packages/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
