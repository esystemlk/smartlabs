import { createHash } from 'crypto';

// "Same answer, same score." AI marking varies a little from run to run, and because scores
// are sums of small criterion marks (e.g. a PTE essay is 26 points scaled to 90), one point
// either way moves the band visibly. So the first result for an exact answer is kept, and
// scoring the identical text again returns that same result instead of asking the AI again.
//
// The key covers everything that changes the result: the task kind, a prompt version (bump it
// when a scorer's rubric/prompt changes so old results are not reused), and the inputs with
// whitespace normalised. Any real edit to the answer gives a new key and a fresh marking.
// Stored server-side only in ai_score_cache (clients have no access).

const COLLECTION = 'ai_score_cache';
const MAX_AGE_DAYS = 60;

const norm = (v: unknown) => (typeof v === 'string' ? v.replace(/\s+/g, ' ').trim() : v ?? null);

export function scoreCacheKey(kind: string, promptVersion: string, inputs: unknown[]): string {
  return createHash('sha256').update(JSON.stringify([kind, promptVersion, ...inputs.map(norm)])).digest('hex');
}

export async function getCachedScore<T>(key: string): Promise<T | null> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) return null;
    const d = (await adminDb.collection(COLLECTION).doc(key).get()).data();
    if (!d?.result) return null;
    const at: Date | undefined = d.createdAt?.toDate?.();
    if (at && Date.now() - at.getTime() > MAX_AGE_DAYS * 86_400_000) return null;
    return d.result as T;
  } catch (e) {
    console.warn('[score-cache] read failed (scoring normally):', e);
    return null; // never block scoring on the cache
  }
}

export async function putCachedScore(key: string, kind: string, result: unknown): Promise<void> {
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    if (!adminDb) return;
    // JSON round-trip drops undefined values, which Firestore rejects.
    await adminDb.collection(COLLECTION).doc(key).set({ kind, result: JSON.parse(JSON.stringify(result)), createdAt: new Date() });
  } catch (e) {
    console.warn('[score-cache] write failed (result still returned):', e);
  }
}
