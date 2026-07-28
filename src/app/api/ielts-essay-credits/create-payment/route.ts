import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { IELTS_ESSAY_PACKAGES, IELTS_ESSAY_ORDER_TYPE } from '@/lib/ielts-essay-packages';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Please sign in to buy credits.' }, { status: 401 });
    }
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const { packageId } = await request.json();
    // Price and credits come from the server's own list — never the client.
    const pkg = IELTS_ESSAY_PACKAGES.find(p => p.id === packageId);
    if (!pkg) return NextResponse.json({ error: 'Invalid package' }, { status: 400 });

    const merchantId = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
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
    const lastName = nameParts.slice(1).join(' ') || '-';

    const orderId = `ieltsessay_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = pkg.price.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: IELTS_ESSAY_ORDER_TYPE,
      packageId: pkg.id,
      scoringCredits: pkg.scoring,
      monthlyDays: pkg.monthlyDays ?? null,
      paymentAmount: pkg.price,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params = {
      merchant_id: merchantId,
      return_url: `${appUrl}/ai-ielts-essay-practice?payment=success&pkg=${pkg.id}`,
      cancel_url: `${appUrl}/ai-ielts-essay-practice?payment=cancelled`,
      notify_url: `${appUrl}/api/payhere/ielts-essay-notify`,
      order_id: orderId,
      items: `SmartLabs IELTS Essay Credits — ${pkg.label}`,
      amount,
      currency,
      first_name: firstName,
      last_name: lastName,
      email,
      phone: (userData.phone as string) || '0000000000',
      address: 'N/A',
      city: 'Colombo',
      country: 'Sri Lanka',
      hash,
    };

    return NextResponse.json({ success: true, params, orderId });
  } catch (error) {
    console.error('[ielts-essay-credits/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
