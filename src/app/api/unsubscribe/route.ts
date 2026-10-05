import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyUid } from '@/lib/email/unsubscribe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Set emailOptOut on a user's doc, verified by the signed token in the link. */
export async function POST(request: Request) {
  try {
    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const { uid, sig } = (await request.json()) as { uid?: string; sig?: string };
    if (!uid || !sig || !verifyUid(uid, sig)) {
      return NextResponse.json({ error: 'This unsubscribe link is invalid or has expired.' }, { status: 400 });
    }
    await adminDb.collection('users').doc(uid).set(
      { emailOptOut: true, emailOptOutAt: FieldValue.serverTimestamp() }, { merge: true });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[unsubscribe] error:', error);
    return NextResponse.json({ error: 'Could not update your preference. Please try again.' }, { status: 500 });
  }
}
