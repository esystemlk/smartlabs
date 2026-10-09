import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getIeltsMockCredits } from '@/lib/ielts-mock-credits';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Session expired' }, { status: 401 }); }
    const c = await getIeltsMockCredits(uid);
    return NextResponse.json({ unlimited: c.unlimited, remaining: c.remaining });
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
