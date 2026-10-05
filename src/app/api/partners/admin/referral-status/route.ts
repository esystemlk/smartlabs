import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Staff update a referral's status as a referred student progresses
 * (e.g. mark them as ENROLLED once they sign up with SmartLabs).
 * Writes go through the Admin SDK only — clients cannot write `referrals`.
 *
 * The partner's monthly commission tier is derived from referrals in the
 * ENROLLED set, so flipping a referral to `enrolled` credits the partner.
 * We also keep the partner's denormalised `counters.enrolled` in step.
 */
const STATUSES = ['new', 'contacted', 'enrolled', 'paid', 'rewarded', 'rejected'] as const;
type Status = (typeof STATUSES)[number];
const ENROLLED = new Set<Status>(['enrolled', 'paid', 'rewarded']);

async function requireStaff(request: Request): Promise<{ uid: string } | NextResponse> {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
  let uid: string;
  try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
  catch { return NextResponse.json({ error: 'Invalid token.' }, { status: 401 }); }
  const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
  if (!['admin', 'developer', 'teacher'].includes(role ?? '')) return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
  return { uid };
}

export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { id, status, note } = (await request.json()) as { id?: string; status?: Status; note?: string };
    if (!id || !status || !STATUSES.includes(status)) {
      return NextResponse.json({ error: 'A referral id and a valid status are required.' }, { status: 400 });
    }

    const refDoc = adminDb!.collection('referrals').doc(id);
    const now = FieldValue.serverTimestamp();
    const result = await adminDb!.runTransaction(async (tx) => {
      const snap = await tx.get(refDoc);
      if (!snap.exists) return { error: 'Referral not found.' as const };
      const data = snap.data() as { status?: Status; partnerUid?: string };
      const current = (data.status ?? 'new') as Status;
      if (current === status) return { status, unchanged: true as const };

      const wasEnrolled = ENROLLED.has(current);
      const nowEnrolled = ENROLLED.has(status);

      const update: Record<string, FieldValue | string> = {
        status,
        updatedAt: now,
        history: FieldValue.arrayUnion({ status, by: `admin:${staff.uid}`, at: new Date().toISOString() }),
      };
      if (nowEnrolled && !wasEnrolled) { update.enrolledAt = now; update.enrolledBy = staff.uid; }
      if ((note ?? '').trim()) update.adminNote = note!.trim();
      tx.update(refDoc, update);

      // Keep the partner's denormalised enrolled counter in step.
      const delta = (nowEnrolled ? 1 : 0) - (wasEnrolled ? 1 : 0);
      if (data.partnerUid && delta !== 0) {
        tx.set(adminDb!.collection('partners').doc(data.partnerUid),
          { counters: { enrolled: FieldValue.increment(delta) } }, { merge: true });
      }
      return { status, partnerUid: data.partnerUid };
    });

    if ('error' in result) return NextResponse.json(result, { status: 404 });

    if (!('unchanged' in result)) {
      await adminDb!.collection('admin_actions').add({
        type: 'referral_status', performedBy: staff.uid, referralId: id,
        targetUid: result.partnerUid ?? null,
        description: `Referral ${id} → ${status}`,
        status, timestamp: new Date(),
      }).catch(() => { /* audit is best-effort */ });
    }

    return NextResponse.json({ success: true, status });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[partners/admin/referral-status] error:', error);
    return NextResponse.json({ error: `Could not update: ${msg}` }, { status: 500 });
  }
}
