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

    const { packageId, months } = (await request.json()) as { packageId?: string; months?: number };
    if (!packageId) return NextResponse.json({ error: 'packageId is required' }, { status: 400 });

    const pkgSnap = await adminDb.collection('recorded_packages').doc(packageId).get();
    if (!pkgSnap.exists) return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    const pkg = pkgSnap.data()!;
    if (pkg.published === false) return NextResponse.json({ error: 'Package is not available' }, { status: 409 });

    // Resolve the chosen duration tier (falls back to the legacy single price).
    const tiers: { months: number; price: number }[] = Array.isArray(pkg.tiers) && pkg.tiers.length
      ? pkg.tiers
      : [{ months: Number(pkg.accessMonths) || 1, price: Number(pkg.price) || 0 }];
    const tier = months
      ? tiers.find((t) => Number(t.months) === Number(months))
      : tiers[0];
    if (!tier || !(Number(tier.price) > 0)) {
      return NextResponse.json({ error: 'Selected plan is not available for this package.' }, { status: 400 });
    }
    const accessMonths = Number(tier.months) || 1;
    const tierPrice = Number(tier.price);

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
    const amount = tierPrice.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'recorded_package',
      packageId,
      packageTitle: (pkg.title as string) ?? 'Recorded Package',
      accessMonths,
      paymentAmount: tierPrice,
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
