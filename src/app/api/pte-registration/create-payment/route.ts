import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getPtePackage } from '@/lib/pte-packages';

export const runtime = 'nodejs';

const md5 = (data: string) => createHash('md5').update(data).digest('hex').toUpperCase();

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Please sign in to register.' }, { status: 401 });
    }
    if (!adminAuth || !adminDb) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }
    const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
    const uid = decoded.uid;

    const body = await request.json();
    const { packageId, batchId, fullName, phone } = body as {
      packageId?: string; batchId?: string; fullName?: string; phone?: string;
    };

    const pkg = getPtePackage(String(packageId));
    if (!pkg) return NextResponse.json({ error: 'Invalid course package.' }, { status: 400 });

    if (!batchId) return NextResponse.json({ error: 'Please select a batch.' }, { status: 400 });
    const cleanPhone = String(phone ?? '').replace(/[^0-9+]/g, '');
    if (cleanPhone.length < 9) {
      return NextResponse.json({ error: 'A valid contact number is required.' }, { status: 400 });
    }
    const name = String(fullName ?? '').trim();
    if (name.length < 2) {
      return NextResponse.json({ error: 'Please enter your full name.' }, { status: 400 });
    }

    // ── Validate the batch: exists, open, offers this package, has a seat ──
    const batchSnap = await adminDb.collection('pte_batches').doc(String(batchId)).get();
    if (!batchSnap.exists) {
      return NextResponse.json({ error: 'That batch no longer exists.' }, { status: 404 });
    }
    const batch = batchSnap.data()!;
    if (batch.status !== 'open') {
      return NextResponse.json({ error: 'This batch is closed for registration.' }, { status: 409 });
    }
    const offered: string[] = Array.isArray(batch.packageIds) ? batch.packageIds : [];
    if (offered.length && !offered.includes(pkg.id)) {
      return NextResponse.json({ error: 'This package is not offered in the selected batch.' }, { status: 409 });
    }
    const seats = Number(batch.seats ?? 0);
    const filled = Number(batch.seatsFilled ?? 0);
    if (seats > 0 && filled >= seats) {
      return NextResponse.json({ error: 'This batch is full. Please choose another.' }, { status: 409 });
    }

    const merchantId     = process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID;
    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const appUrl         = process.env.NEXT_PUBLIC_APP_URL;
    if (!merchantId || !merchantSecret || !appUrl) {
      return NextResponse.json({ error: 'Payment not configured' }, { status: 500 });
    }

    const email: string =
      (decoded.email as string) ||
      ((await adminDb.collection('users').doc(uid).get()).data()?.email as string) ||
      'noreply@smartlabs.lk';
    const nameParts = name.split(' ');

    const orderId = `pte_${uid.slice(0, 8)}_${Date.now()}`;
    const amount = pkg.price.toFixed(2);
    const currency = 'LKR';
    const hash = md5(`${merchantId}${orderId}${amount}${currency}${md5(merchantSecret)}`);

    await adminDb.collection('payment_orders').add({
      orderId,
      userId: uid,
      type: 'pte_course',
      packageId: pkg.id,
      packageName: pkg.name,
      batchId: String(batchId),
      batchName: (batch.name as string) ?? '',
      fullName: name,
      phone: cleanPhone,
      email,
      paymentAmount: pkg.price,
      paymentStatus: 'pending',
      createdAt: new Date(),
    });

    const params: Record<string, string> = {
      merchant_id: merchantId,
      return_url:  `${appUrl}/pte-registration?payment=success`,
      cancel_url:  `${appUrl}/pte-registration?payment=cancelled`,
      notify_url:  `${appUrl}/api/payhere/pte-course-notify`,
      order_id:    orderId,
      items:       `Smart Labs PTE — ${pkg.name} (${(batch.name as string) ?? 'Batch'})`,
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
    console.error('[pte-registration/create-payment]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
