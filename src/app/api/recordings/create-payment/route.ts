import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { priceBreakdown, RECORDING_PRICE } from '@/types/recording';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Please sign in to purchase a recording.' }, { status: 401 });
    }
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const { recordingId } = (await request.json()) as { recordingId?: string };
    if (!recordingId) return NextResponse.json({ error: 'recordingId is required' }, { status: 400 });

    // Price and title come from the server's own record — never from the client.
    const recSnap = await adminDb.collection('class_recordings').doc(recordingId).get();
    if (!recSnap.exists) return NextResponse.json({ error: 'Recording not found' }, { status: 404 });
    const rec = recSnap.data() ?? {};
    if (rec.published === false) {
      return NextResponse.json({ error: 'This recording is not available yet.' }, { status: 400 });
    }

    // Already has valid access? Don't let them pay twice.
    const existing = await adminDb.collection('recording_access').doc(`${uid}_${recordingId}`).get();
    if (existing.exists) {
      const d = existing.data() ?? {};
      const exp = d.expiresAt?.toDate?.() ?? null;
      if (d.status === 'active' && (!exp || exp > new Date())) {
        return NextResponse.json({ error: 'You already have access to this recording.', code: 'ALREADY_OWNED' }, { status: 400 });
      }
    }

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
    const firstName = nameParts[0] || 'Student';
    const lastName = nameParts.slice(1).join(' ') || '-';

    // Base price + 2.99% processing fee.
    const base = typeof rec.price === 'number' ? rec.price : RECORDING_PRICE;
    const { fee, total } = priceBreakdown(base);

    const orderId = `rec_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = total.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'class_recording',
      recordingId,
      recordingTitle: rec.title ?? 'Class Recording',
      basePrice: base,
      processingFee: fee,
      paymentAmount: total,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params = {
      merchant_id: merchantId,
      return_url: `${appUrl}/dashboard/recordings?payment=success`,
      cancel_url: `${appUrl}/dashboard/recordings?payment=cancelled`,
      notify_url: `${appUrl}/api/payhere/recording-notify`,
      order_id: orderId,
      items: `Class Recording — ${rec.title ?? recordingId}`,
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

    return NextResponse.json({ success: true, params, orderId, basePrice: base, processingFee: fee, total });
  } catch (error) {
    console.error('[recordings/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
