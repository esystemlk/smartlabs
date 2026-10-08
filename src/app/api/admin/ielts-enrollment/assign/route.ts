import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { sendMail } from '@/lib/mail';
import { renderIeltsBatchEmail } from '@/lib/ielts-batch-email';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CONTACT = 'contact@smartlabs.lk';
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.smartlabs.lk';

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

/** Assign an IELTS enrolment to a batch and email the student the details. */
export async function POST(request: Request) {
  try {
    const staff = await requireStaff(request);
    if (staff instanceof NextResponse) return staff;

    const { orderId, batchName, startDate, schedule, whatsappLink } = (await request.json()) as {
      orderId?: string; batchName?: string; startDate?: string; schedule?: string; whatsappLink?: string;
    };
    if (!orderId) return NextResponse.json({ error: 'orderId is required.' }, { status: 400 });
    const name = (batchName ?? '').trim();
    if (name.length < 2) return NextResponse.json({ error: 'A batch name is required.' }, { status: 400 });

    const ref = adminDb!.collection('ielts_course_enrollments').doc(String(orderId));
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Enrolment not found.' }, { status: 404 });
    const e = snap.data() as { userId?: string; email?: string; fullName?: string };

    const now = FieldValue.serverTimestamp();
    const batch = {
      batchName: name,
      startDate: (startDate ?? '').trim(),
      schedule: (schedule ?? '').trim(),
      whatsappLink: (whatsappLink ?? '').trim(),
      batchStatus: 'enrolled',
      enrolledBy: staff.uid,
      enrolledAt: now,
      updatedAt: now,
    };
    await ref.set(batch, { merge: true });

    // Mirror onto the student's own enrolment doc (powers their dashboard).
    if (e.userId) {
      await adminDb!.collection('users').doc(e.userId).collection('enrollments').doc(String(orderId))
        .set({ batchName: name, batchStatus: 'enrolled', updatedAt: now }, { merge: true })
        .catch(() => { /* best-effort */ });
    }

    await adminDb!.collection('admin_actions').add({
      type: 'ielts_batch_assign', performedBy: staff.uid, orderId: String(orderId), targetUid: e.userId ?? null,
      description: `IELTS enrolment ${orderId} assigned to ${name}`, timestamp: new Date(),
    }).catch(() => { /* best-effort */ });

    // Notify the student (best-effort).
    if (e.email) {
      try {
        await sendMail({
          to: String(e.email), replyTo: CONTACT,
          subject: `You're enrolled — ${name} | Smart Labs IELTS`,
          html: renderIeltsBatchEmail({
            fullName: String(e.fullName ?? 'there'),
            batchName: name, startDate: batch.startDate, schedule: batch.schedule, whatsappLink: batch.whatsappLink,
            dashboardUrl: `${APP_URL}/dashboard`,
          }),
        });
      } catch (err) { console.error('[ielts-enrollment/assign] email failed:', err); }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[ielts-enrollment/assign] error:', error);
    return NextResponse.json({ error: `Could not assign: ${msg}` }, { status: 500 });
  }
}
