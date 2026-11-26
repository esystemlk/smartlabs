import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { COURSES, coordAccess } from '@/lib/server/coordinators';

export const runtime = 'nodejs';

/**
 * POST { name }                          → new course (shared by all coordinators)
 * POST { courseId, batchName, fee }      → new batch under that course
 * DELETE ?id=<courseId>[&batch=<batchId>] → developer only
 */
export async function POST(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  const body = await request.json().catch(() => ({}));
  const name = String(body.name || body.batchName || '').trim().slice(0, 120);
  if (!name) return NextResponse.json({ error: 'Enter a name.' }, { status: 400 });

  if (!body.courseId) {
    const dupe = await adminDb!.collection(COURSES).where('nameLower', '==', name.toLowerCase()).limit(1).get();
    if (!dupe.empty) return NextResponse.json({ error: 'That course already exists.' }, { status: 409 });
    const ref = await adminDb!.collection(COURSES).add({ name, nameLower: name.toLowerCase(), batches: [], createdBy: a.email, createdAt: admin.firestore.FieldValue.serverTimestamp() });
    return NextResponse.json({ id: ref.id });
  }

  const fee = Math.max(0, Math.round(Number(body.fee) || 0));
  const ref = adminDb!.collection(COURSES).doc(String(body.courseId));
  const batch = { id: randomUUID().slice(0, 8), name, fee, createdBy: a.email };
  try {
    await adminDb!.runTransaction(async tx => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error('NOT_FOUND');
      const batches = (snap.data()!.batches || []) as { name: string }[];
      if (batches.some(b => b.name.toLowerCase() === name.toLowerCase())) throw new Error('DUPLICATE');
      tx.update(ref, { batches: [...batches, batch] });
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : '';
    if (m === 'NOT_FOUND') return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    if (m === 'DUPLICATE') return NextResponse.json({ error: 'That batch already exists for this course.' }, { status: 409 });
    throw e;
  }
  return NextResponse.json({ batch });
}

export async function DELETE(request: Request) {
  const a = await coordAccess(request);
  if (!a.ok) return NextResponse.json({ error: a.error }, { status: a.status });
  if (!a.isDev) return NextResponse.json({ error: 'Developers only.' }, { status: 403 });
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  const batchId = url.searchParams.get('batch');
  const ref = adminDb!.collection(COURSES).doc(id);
  if (batchId) {
    const snap = await ref.get();
    if (snap.exists) await ref.update({ batches: (snap.data()!.batches || []).filter((b: { id: string }) => b.id !== batchId) });
  } else {
    await ref.delete();
  }
  // Existing student entries keep their saved course and batch names.
  return NextResponse.json({ ok: true });
}
