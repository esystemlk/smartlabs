import { NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { PAYMENT_METHODS, monthOf, normalizePhone } from '@/lib/coordinators';
import { COURSES, ENTRIES, coordAccess, editable, slipFile } from '@/lib/server/coordinators';

export const runtime = 'nodejs';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates the student form; returns the clean fields or an error message. */
async function readStudent(body: any) {
  const name = String(body.name || '').trim().slice(0, 120);
  const phone = normalizePhone(String(body.phone || ''));
  const email = String(body.email || '').trim().toLowerCase().slice(0, 160);
  const fee = Math.round(Number(body.fee));
  const paid = Math.round(Number(body.paid));
  const method = PAYMENT_METHODS.includes(body.method) ? body.method : '';
  const paidOn = /^\d{4}-\d{2}-\d{2}$/.test(String(body.paidOn || '')) ? String(body.paidOn) : '';
  if (!name) return 'Enter the student name.';
  if (phone.replace(/\D/g, '').length < 9) return 'Enter a valid contact number.';
  if (!EMAIL.test(email)) return 'Enter a valid email.';
  if (!Number.isFinite(fee) || fee <= 0) return 'Enter the course fee.';
  if (!Number.isFinite(paid) || paid < 0 || paid > fee) return 'Amount paid must be between 0 and the fee.';
  if (!method) return 'Choose the payment method.';
  if (!paidOn) return 'Enter the date paid.';
  const course = await adminDb!.collection(COURSES).doc(String(body.courseId || '')).get();
  const batch = (course.data()?.batches || []).find((b: { id: string }) => b.id === body.batchId);
  if (!course.exists || !batch) return 'Choose the course and batch.';
  return { name, phone, email, fee, paid, method, paidOn, note: String(body.note || '').trim().slice(0, 500),
    courseId: course.id, courseName: course.data()!.name, batchId: batch.id, batchName: batch.name };
}

/** POST → add a student enrolled by the signed-in coordinator. */
export async function POST(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const s = await readStudent(await request.json().catch(() => ({})));
  if (typeof s === 'string') return NextResponse.json({ error: s }, { status: 400 });
  const ref = await adminDb!.collection(ENTRIES).add({
    ...s, coordinatorUid: a.uid, coordinatorEmail: a.email, coordinatorName: a.name,
    month: monthOf(Date.now()), slipPath: '', dupDecision: null, unlocked: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(), updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  return NextResponse.json({ id: ref.id });
}

/**
 * PATCH { id, ...student fields }   → edit
 * PATCH { id, dupDecision }         → developer: 'credit' | 'no-credit' | null
 * PATCH { id, unlocked }            → developer: let the coordinator edit a closed month
 */
export async function PATCH(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const body = await request.json().catch(() => ({}));
  const e = await editable(a, String(body.id || ''));
  if ('error' in e) return NextResponse.json({ error: e.error }, { status: e.status });

  if ('dupDecision' in body || 'unlocked' in body) {
    if (!a.isDev) return NextResponse.json({ error: 'Developers only.' }, { status: 403 });
    const patch: Record<string, unknown> = {};
    if ('dupDecision' in body) patch.dupDecision = ['credit', 'no-credit'].includes(body.dupDecision) ? body.dupDecision : null;
    if ('unlocked' in body) patch.unlocked = !!body.unlocked;
    await e.ref.update(patch);
    return NextResponse.json({ ok: true });
  }

  const s = await readStudent(body);
  if (typeof s === 'string') return NextResponse.json({ error: s }, { status: 400 });
  // A changed phone number re-opens any earlier duplicate decision.
  await e.ref.update({ ...s, ...(s.phone !== e.data.phone ? { dupDecision: null } : {}), updatedAt: admin.firestore.FieldValue.serverTimestamp() });
  return NextResponse.json({ ok: true });
}

/** DELETE ?id= */
export async function DELETE(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const e = await editable(a, new URL(request.url).searchParams.get('id') || '');
  if ('error' in e) return NextResponse.json({ error: e.error }, { status: e.status });
  if (e.data.slipPath) await slipFile(e.data.slipPath).delete({ ignoreNotFound: true }).catch(() => {});
  await e.ref.delete();
  return NextResponse.json({ ok: true });
}

