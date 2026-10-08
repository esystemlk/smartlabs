import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { IELTS_COURSE } from '@/lib/ielts-course';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

/**
 * Start a PayHere payment for the IELTS course. Unlike PTE, no batch is chosen
 * here — the student pays first and an admin assigns a batch later. Price is
 * taken from the server-side IELTS_COURSE constant so it can't be tampered.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Please sign in to register.' }, { status: 401 });
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const { fullName, phone } = (await request.json()) as { fullName?: string; phone?: string };
    const name = String(fullName ?? '').trim();
    if (name.length < 2) return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    const cleanPhone = String(phone ?? '').replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 9) return NextResponse.json({ error: 'A valid contact number is required.' }, { status: 400 });

    const merchantId     = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const appUrl         = process.env.NEXT_PUBLIC_APP_URL;
    if (!merchantId || !merchantSecret || !appUrl) return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });

    const email: string =
      (decoded.email as string) ||
      ((await adminDb.collection('users').doc(uid).get()).data()?.email as string) ||
      'noreply@smartlabs.lk';
    const nameParts = name.split(' ');

    const orderId = `ielts_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = IELTS_COURSE.price.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'ielts_course',
      packageId: IELTS_COURSE.id,
      packageName: IELTS_COURSE.name,
      batchId: '',
      batchName: '',
      fullName: name,
      phone: cleanPhone,
      email,
      paymentAmount: IELTS_COURSE.price,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      merchant_id: merchantId,
      return_url:  `${appUrl}/ielts-registration?payment=success`,
      cancel_url:  `${appUrl}/ielts-registration?payment=cancelled`,
      notify_url:  `${appUrl}/api/payhere/ielts-course-notify`,
      order_id:    orderId,
      items:       `Smart Labs IELTS Course`,
      amount,
      currency,
      first_name:  nameParts[0] || 'Student',
      last_name:   nameParts.slice(1).join(' ') || '-',
      email,
      phone:       cleanPhone,
      address:     'N/A',
      city:        'Colombo',
      country:     'Sri Lanka',
      hash,
    };

    return NextResponse.json({ success: true, params, orderId });
  } catch (error) {
    console.error('[ielts-registration/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
