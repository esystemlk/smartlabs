import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { verifyAuthed } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { recordingAudio, recordingsFor, validRecordingId } from '@/lib/server/speaking-recordings';
import { scorePteSpeaking } from '@/ai/flows/score-pte-speaking';
import { hasCreditFor, deductionFor } from '@/lib/services/ai-credits';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;
const headers = { 'Cache-Control': 'private, no-store' };
const pool = { paid: 'speakingPaidCredits', monthly: 'speakingMonthlyExpiry', free: 'speakingFreeUsed', freeLimit: 3 };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status, headers });
  const { id } = await context.params;
  if (!validRecordingId(id)) return NextResponse.json({ error: 'Recording not found.' }, { status: 404, headers });
  const ref = recordingsFor(auth.uid).doc(id);
  const userRef = adminDb!.collection('users').doc(auth.uid);
  const lease = randomUUID();
  try {
    const answer = await adminDb!.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (!doc.exists) throw new Error('NOT_FOUND');
      const data = doc.data()!;
      if (data.status === 'deleting') throw new Error('NOT_FOUND');
      if (data.score) return data;
      if (data.status === 'scoring' && data.scoringUntil > Date.now()) throw new Error('BUSY');
      const profile = await transaction.get(userRef);
      const user = profile.data() ?? {};
      let reservedCredit = data.reservedCredit ?? null;
      if (!reservedCredit && !['admin', 'developer', 'teacher'].includes(user.role)) {
        if (!hasCreditFor(user, pool)) throw new Error('NO_CREDITS');
        const deduction = deductionFor(user, pool);
        if (deduction) {
          const field = Object.keys(deduction)[0];
          reservedCredit = { field, delta: field === pool.free ? 1 : -1 };
          transaction.update(userRef, deduction);
        }
      }
      transaction.update(ref, { status: 'scoring', scoringUntil: Date.now() + 150000, scoringLease: lease, reservedCredit });
      return data;
    });
    if (answer.score) return NextResponse.json({ score: answer.score }, { headers });
    const [audio] = await recordingAudio(auth.uid, id).download();
    const score = await scorePteSpeaking({ taskType: answer.taskType, promptText: answer.promptText,
      imageUrl: answer.imageUrl || undefined, audioDataUri: `data:${answer.mimeType};base64,${audio.toString('base64')}` });
    await adminDb!.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (doc.exists && doc.data()!.scoringLease === lease) transaction.update(ref, { score, status: 'scored', scoringUntil: 0, reservedCredit: null });
    });
    return NextResponse.json({ score }, { headers });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'NOT_FOUND') return NextResponse.json({ error: 'Recording not found.' }, { status: 404, headers });
    if (message === 'BUSY') return NextResponse.json({ error: 'This answer is already being checked. Refresh your recordings shortly.' }, { status: 409, headers });
    if (message === 'NO_CREDITS') return NextResponse.json({ error: 'Your recording is saved. Add AI credits on the Credits page to check this answer.' }, { status: 402, headers });
    await adminDb!.runTransaction(async transaction => {
      const doc = await transaction.get(ref);
      if (doc.exists && doc.data()!.scoringLease === lease) {
        const reserved = doc.data()!.reservedCredit;
        if (reserved) transaction.update(userRef, { [reserved.field]: FieldValue.increment(-reserved.delta) });
        transaction.update(ref, { status: 'failed', scoringUntil: 0, reservedCredit: null });
      }
    }).catch(() => {});
    return NextResponse.json({ error: 'AI checking did not finish. Your recording is saved; you can replay it or retry checking.' }, { status: 500, headers });
  }
}
