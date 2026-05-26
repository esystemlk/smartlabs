import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createCertificateRequest, CERT_PRICES } from '@/lib/services/certificate.service';

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
    const userId = decoded.uid;
    const email = decoded.email ?? '';

    const body = await request.json();
    const { nameOnCertificate, type, identityType, identityFrontUrl, identityBackUrl, country, shippingAddress } = body;

    if (!nameOnCertificate || !type || !identityType || !identityFrontUrl || !country) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['digital', 'printed'].includes(type)) {
      return NextResponse.json({ error: 'Invalid certificate type' }, { status: 400 });
    }

    if (!['nic', 'passport'].includes(identityType)) {
      return NextResponse.json({ error: 'Invalid identity type' }, { status: 400 });
    }

    if (identityType === 'nic' && !identityBackUrl) {
      return NextResponse.json({ error: 'NIC back side image is required' }, { status: 400 });
    }

    const amount = CERT_PRICES[type as 'digital' | 'printed'];

    const requestId = await createCertificateRequest({
      userId,
      email,
      nameOnCertificate: nameOnCertificate.trim(),
      type,
      status: 'pending_payment',
      identityType,
      identityFrontUrl,
      identityBackUrl: identityBackUrl || undefined,
      country,
      shippingAddress: shippingAddress || undefined,
      paymentStatus: 'pending',
      amount,
    });

    return NextResponse.json({ success: true, requestId, amount });
  } catch (error) {
    console.error('[certificates/request] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
