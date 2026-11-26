import 'server-only';
import { randomUUID } from 'crypto';
import { getStorage } from 'firebase-admin/storage';
import admin from 'firebase-admin';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { firebaseConfig } from '@/firebase/config';
import { reviewAudioFrom } from '@/lib/answer-review-audio';

/**
 * Keeps a copy of what a student answered in the PTE AI trainers (text, and the
 * recording for speaking) so admins can review it. Each entry expires after
 * ANSWER_RETENTION_DAYS; /api/cron/expire-answers then deletes the answer text and
 * audio but keeps the score. Saving never blocks or fails the student's scoring.
 */
export const ANSWER_RETENTION_DAYS = 200;
export const ANSWER_REVIEWS = 'answer_reviews';
const MAX_RESULT_JSON = 150_000;

export const reviewBucket = () => getStorage().bucket(firebaseConfig.storageBucket);
export const expiryDate = () => admin.firestore.Timestamp.fromMillis(Date.now() + ANSWER_RETENTION_DAYS * 86400000);

/** Saves audio (bytes or a data: URI) to Storage under answer-reviews/<uid>/; returns its path, or null. */
export async function saveReviewAudio(uid: string, audio: { bytes?: Uint8Array; dataUri?: string; mimeType?: string }): Promise<string | null> {
  const a = reviewAudioFrom(audio);
  if (!a) return null;
  const path = `answer-reviews/${uid}/${Date.now()}-${randomUUID()}.${a.ext}`;
  await reviewBucket().file(path).save(Buffer.from(a.bytes), { resumable: false, metadata: { contentType: a.mime, cacheControl: 'private, no-store' } });
  return path;
}

export interface ReviewEntry {
  uid: string;
  tool: 'essay' | 'swt' | 'sst' | 'wfd' | 'speaking';
  taskType?: string;
  prompt?: string;
  answer?: string;
  result?: unknown;
  audio?: { bytes?: Uint8Array; dataUri?: string; mimeType?: string };
}

/** Fire-and-forget: call without await so a storage hiccup never costs the student their score. */
export async function saveAnswerForReview(e: ReviewEntry): Promise<void> {
  try {
    if (!adminDb) return;
    const [user, authUser] = await Promise.all([
      adminDb.collection('users').doc(e.uid).get().then(s => s.data()).catch(() => undefined),
      adminAuth?.getUser(e.uid).catch(() => undefined),
    ]);
    const audioPath = e.audio ? await saveReviewAudio(e.uid, e.audio).catch(() => null) : null;
    let result: unknown = null;
    try { const json = JSON.stringify(e.result ?? null); result = json.length <= MAX_RESULT_JSON ? JSON.parse(json) : null; } catch { /* unserialisable */ }
    await adminDb.collection(ANSWER_REVIEWS).add({
      uid: e.uid,
      userName: user?.name || user?.displayName || authUser?.displayName || '',
      userEmail: String(user?.email || authUser?.email || '').toLowerCase(),
      tool: e.tool,
      taskType: e.taskType || e.tool,
      prompt: (e.prompt || '').slice(0, 8000),
      answer: (e.answer || '').slice(0, 20000),
      result,
      audioPath,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: expiryDate(),
      purged: false,
    });
  } catch (err) {
    console.warn('[answer-reviews] could not save answer for review:', err instanceof Error ? err.message : err);
  }
}
