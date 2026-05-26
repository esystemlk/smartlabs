import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { getUserCertificateRequests } from '@/lib/services/certificate.service';

export async function GET(request: NextRequest) {
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
    const requests = await getUserCertificateRequests(decoded.uid);

    // Serialize Timestamps
    const serialized = requests.map(r => ({
      ...r,
      createdAt: r.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: r.updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ requests: serialized });
  } catch (error) {
    console.error('[certificates/my-requests] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
