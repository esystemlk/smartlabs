import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyStaff } from '@/lib/api-auth';
import { ACCESS_DAYS } from '@/types/recording';

export const runtime = 'nodejs';

/**
 * Staff-only management of student recording access.
 * Actions:
 *   grant      { userId, recordingId }            — give access (manual/offline payment)
 *   move       { accessId, recordingId }          — switch which recording a student has
 *   extend     { accessId, days }                 — push the expiry out
 *   setStatus  { accessId, status }               — active | suspended | expired
 *   revoke     { accessId }                       — delete the access row
 */
export async function POST(request: Request) {
  try {
    const auth = await verifyStaff(request);
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });

    const body = await request.json();
    const { action } = body as { action?: string };

    if (action === 'grant') {
      const { userId, recordingId } = body as { userId: string; recordingId: string };
      if (!userId || !recordingId) return NextResponse.json({ error: 'userId and recordingId are required.' }, { status: 400 });

      const rec = await adminDb.collection('class_recordings').doc(recordingId).get();
      if (!rec.exists) return NextResponse.json({ error: 'Recording not found.' }, { status: 404 });
      const user = await adminDb.collection('users').doc(userId).get();
      if (!user.exists) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

      const purchasedAt = new Date();
      const expiresAt = new Date(purchasedAt);
      expiresAt.setDate(expiresAt.getDate() + ACCESS_DAYS);

      await adminDb.collection('recording_access').doc(`${userId}_${recordingId}`).set({
        userId,
        userEmail: user.data()?.email ?? null,
        userName: user.data()?.displayName ?? null,
        recordingId,
        recordingTitle: rec.data()?.title ?? 'Class Recording',
        purchasedAt,
        expiresAt,
        status: 'active',
        grantedBy: auth.uid,
        amountPaid: 0,
      }, { merge: true });
      return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });
    }

    if (action === 'move') {
      const { accessId, recordingId } = body as { accessId: string; recordingId: string };
      if (!accessId || !recordingId) return NextResponse.json({ error: 'accessId and recordingId are required.' }, { status: 400 });

      const oldRef = adminDb.collection('recording_access').doc(accessId);
      const oldSnap = await oldRef.get();
      if (!oldSnap.exists) return NextResponse.json({ error: 'Access record not found.' }, { status: 404 });

      const rec = await adminDb.collection('class_recordings').doc(recordingId).get();
      if (!rec.exists) return NextResponse.json({ error: 'Target recording not found.' }, { status: 404 });

      const d = oldSnap.data()!;
      // Access ids are `${userId}_${recordingId}` — moving means a new id, so
      // write the new row and drop the old one.
      const newRef = adminDb.collection('recording_access').doc(`${d.userId}_${recordingId}`);
      await newRef.set({
        ...d,
        recordingId,
        recordingTitle: rec.data()?.title ?? 'Class Recording',
        movedBy: auth.uid,
        movedAt: new Date(),
      }, { merge: true });
      if (newRef.id !== oldRef.id) await oldRef.delete();

      return NextResponse.json({ success: true });
    }

    if (action === 'extend') {
      const { accessId, days } = body as { accessId: string; days: number };
      if (!accessId || !days) return NextResponse.json({ error: 'accessId and days are required.' }, { status: 400 });

      const ref = adminDb.collection('recording_access').doc(accessId);
      const snap = await ref.get();
      if (!snap.exists) return NextResponse.json({ error: 'Access record not found.' }, { status: 404 });

      const current = snap.data()?.expiresAt?.toDate?.() ?? new Date();
      // Extending an already-expired pass runs from today, not from the old date.
      const base = current > new Date() ? current : new Date();
      const expiresAt = new Date(base);
      expiresAt.setDate(expiresAt.getDate() + Number(days));

      await ref.update({ expiresAt, status: 'active' });
      return NextResponse.json({ success: true, expiresAt: expiresAt.toISOString() });
    }

    if (action === 'setStatus') {
      const { accessId, status } = body as { accessId: string; status: string };
      if (!accessId || !['active', 'suspended', 'expired'].includes(status)) {
        return NextResponse.json({ error: 'Valid accessId and status are required.' }, { status: 400 });
      }
      await adminDb.collection('recording_access').doc(accessId).update({ status });
      return NextResponse.json({ success: true });
    }

    if (action === 'revoke') {
      const { accessId } = body as { accessId: string };
      if (!accessId) return NextResponse.json({ error: 'accessId is required.' }, { status: 400 });
      await adminDb.collection('recording_access').doc(accessId).delete();
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (error) {
    console.error('[admin/recording-access]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
