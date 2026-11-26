import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { adminDb } from '@/lib/firebase-admin';
import { ANSWER_REVIEWS, ANSWER_RETENTION_DAYS, reviewBucket } from '@/lib/server/answer-reviews';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Daily (vercel.json): 200 days after a student answered, delete what they wrote and said but keep
 * their score.
 *  - answer_reviews (PTE AI trainers): clear prompt/answer, delete the recording, mark purged.
 *  - levelTestResults: remove the saved answers, the speaking transcript and the recording.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get('Authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!adminDb) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const now = admin.firestore.Timestamp.now();
  const cutoff = admin.firestore.Timestamp.fromMillis(Date.now() - ANSWER_RETENTION_DAYS * 86400000);
  const del = admin.firestore.FieldValue.delete();
  const dropAudio = (path?: string) => (path ? reviewBucket().file(path).delete({ ignoreNotFound: true }).catch(() => {}) : Promise.resolve());
  let trainer = 0, level = 0, failed = 0;

  // Cleaning removes expiresAt, so rows already cleaned never match this query again (single-field index only).
  const due = await adminDb.collection(ANSWER_REVIEWS).where('expiresAt', '<=', now).limit(400).get();
  for (const d of due.docs) {
    try {
      await dropAudio(d.data().audioPath);
      await d.ref.update({ prompt: del, answer: del, audioPath: del, expiresAt: del, purged: true, purgedAt: now });
      trainer++;
    } catch { failed++; }
  }

  // Level tests: walk results in date order from a saved bookmark, so each one is cleaned once.
  const cursorRef = adminDb.collection('system_config').doc('answer_purge_cursor');
  const after = (await cursorRef.get()).data()?.levelTestsUntil as admin.firestore.Timestamp | undefined;
  let q = adminDb.collection('levelTestResults').where('timestamp', '<=', cutoff).orderBy('timestamp', 'asc');
  if (after) q = q.where('timestamp', '>', after);
  const old = await q.limit(400).get();
  for (const d of old.docs) {
    const r = d.data();
    if (r.answersPurged) continue;
    try {
      await dropAudio(r.speakingAudioPath);
      await d.ref.update({ answers: del, speakingAudioPath: del, 'aiFeedback.speaking.transcript': del, answersPurged: true, answersPurgedAt: now });
      level++;
    } catch { failed++; }
  }

  const last = old.docs[old.docs.length - 1]?.data().timestamp;
  if (last && !failed) await cursorRef.set({ levelTestsUntil: last }, { merge: true });

  return NextResponse.json({ ok: true, trainer, level, failed });
}
