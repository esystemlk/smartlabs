import { NextResponse } from 'next/server';
import { verifyAuthed } from '@/lib/api-auth';
import { adminDb } from '@/lib/firebase-admin';
import { saveReviewAudio } from '@/lib/server/answer-reviews';

export const runtime = 'nodejs';

/**
 * POST { resultId, audioDataUri }: stores the student's level-test speaking recording so admins can
 * listen to it in the level test report. Deleted with the other answers after 200 days (cron).
 */
export async function POST(request: Request) {
  const auth = await verifyAuthed(request);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { resultId, audioDataUri } = (await request.json().catch(() => ({}))) as { resultId?: string; audioDataUri?: string };
  if (!resultId || typeof audioDataUri !== 'string' || !audioDataUri.startsWith('data:audio')) {
    return NextResponse.json({ error: 'resultId and an audio recording are required.' }, { status: 400 });
  }
  const ref = adminDb!.collection('levelTestResults').doc(resultId);
  const snap = await ref.get();
  if (!snap.exists || snap.data()!.userId !== auth.uid) return NextResponse.json({ error: 'Result not found.' }, { status: 404 });
  if (snap.data()!.speakingAudioPath) return NextResponse.json({ ok: true });
  const path = await saveReviewAudio(auth.uid, { dataUri: audioDataUri });
  if (!path) return NextResponse.json({ error: 'Recording is empty or too large.' }, { status: 400 });
  await ref.update({ speakingAudioPath: path });
  return NextResponse.json({ ok: true });
}
