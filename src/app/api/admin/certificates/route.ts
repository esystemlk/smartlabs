import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getAllCertificateRequests } from '@/lib/services/certificate.service';

async function verifyAdmin(token: string): Promise<boolean> {
  if (!adminAuth || !adminDb) return false;
  const decoded = await adminAuth.verifyIdToken(token);
  const snap = await adminDb.collection('users').doc(decoded.uid).get();
  if (!snap.exists) return false;
  const role = snap.data()?.role;
  return role === 'admin' || role === 'developer' || role === 'teacher';
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const token = authHeader.split('Bearer ')[1];

    const ok = await verifyAdmin(token);
    if (!ok) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const requests = await getAllCertificateRequests();

    const serialized = requests.map(r => ({
      ...r,
      createdAt: r.createdAt?.toDate?.()?.toISOString() ?? null,
      updatedAt: r.updatedAt?.toDate?.()?.toISOString() ?? null,
    }));

    return NextResponse.json({ requests: serialized });
  } catch (error) {
    console.error('[admin/certificates] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
