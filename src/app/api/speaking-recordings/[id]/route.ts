import { NextResponse } from 'next/server';
import { verifyAuthed } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { recordingAudio, recordingsFor, validRecordingId } from '@/lib/server/speaking-recordings';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const headers = { 'Cache-Control': 'private, no-store' };
type Context = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: Context) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
  const { id } = await context.params;
  if (!validRecordingId(id)) return NextResponse.json({ error: 'Recording not found.' }, { status: 404, headers });
  try {
    const doc = await recordingsFor(auth.uid).doc(id).get();
    if (!doc.exists) return NextResponse.json({ error: 'Recording not found.' }, { status: 404, headers });
    const [bytes] = await recordingAudio(auth.uid, id).download();
    return new Response(new Uint8Array(bytes), { headers: { ...headers, 'Content-Type': doc.data()!.mimeType, 'Content-Length': String(bytes.length), 'X-Content-Type-Options': 'nosniff' } });
  } catch {
    return NextResponse.json({ error: 'Could not load this recording.' }, { status: 500, headers });
  }
}

export async function DELETE(request: Request, context: Context) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
  const { id } = await context.params;
  if (!validRecordingId(id)) return NextResponse.json({ error: 'Recording not found.' }, { status: 404, headers });
  try {
    const ref = recordingsFor(auth.uid).doc(id);
    await adminDb!.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (!doc.exists) return;
      const data = doc.data()!;
      if (data.status === 'scoring' && data.scoringUntil > Date.now()) throw new Error('BUSY');
      if (data.reservedCredit) transaction.update(adminDb!.collection('users').doc(auth.uid), { [data.reservedCredit.field]: FieldValue.increment(-data.reservedCredit.delta) });
      transaction.update(ref, { status: 'deleting', reservedCredit: null });
    });
    await recordingAudio(auth.uid, id).delete({ ignoreNotFound: true });
    await ref.delete();
    return NextResponse.json({ ok: true }, { headers });
  } catch (error) {
    if (error instanceof Error && error.message === 'BUSY') return NextResponse.json({ error: 'AI checking is in progress. Please try deleting after it finishes.' }, { status: 409, headers });
    return NextResponse.json({ error: 'Could not delete this recording.' }, { status: 500, headers });
  }
}
