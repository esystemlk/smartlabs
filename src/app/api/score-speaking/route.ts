import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import { isInternalRequest } from '@/lib/internal-auth';
import { scorePteSpeaking } from '@/ai/flows/score-pte-speaking';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI scoring for every PTE Academic SPEAKING task (Read Aloud, Repeat Sentence,
 * Describe Image, Retell Lecture, Answer Short Question, Summarize Group
 * Discussion, Respond to a Situation).
 *
 * The client records the student's answer and posts a data:audio/…;base64 URI.
 * Auth + credits mirror the SST route exactly, but on its OWN "speaking" credit
 * pool (`speakingFreeUsed` / `speakingPaidCredits` / `speakingMonthlyExpiry`).
 * The scoring itself reuses the shared `scorePteSpeaking` Genkit flow, so the
 * app and any future website speaking trainer stay in sync.
 */

const UNLIMITED_ROLES = new Set(['admin', 'developer', 'teacher']);
const FREE_SPEAKING_LIMIT = 3;

type CreditResult =
  | { ok: true; unlimited: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: false; status: number; code: string; message: string; extra?: any };

async function verifyCredits(uid: string): Promise<CreditResult> {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';
  if (UNLIMITED_ROLES.has(role)) return { ok: true, unlimited: true };
  const freeUsed = (d.speakingFreeUsed as number) ?? 0;
  const paid = (d.speakingPaidCredits as number) ?? 0;
  const expiry = d.speakingMonthlyExpiry?.toDate?.() ?? null;
  const hasMonthly = !!(expiry && expiry > new Date());
  if (!hasMonthly && paid <= 0 && freeUsed >= FREE_SPEAKING_LIMIT) {
    return {
      ok: false, status: 402, code: 'NO_CREDITS',
      message: `You have used your ${FREE_SPEAKING_LIMIT} free speaking scorings. Purchase credits to keep practising.`,
      extra: { freeUsed, freeTotal: FREE_SPEAKING_LIMIT, paidCredits: paid, hasMonthly },
    };
  }
  return { ok: true, unlimited: false };
}

async function deductSpeakingCredit(uid: string): Promise<void> {
  const userRef = adminDb!.collection('users').doc(uid);
  const snap = await userRef.get();
  const d = snap.data() ?? {};
  const expiry = d.speakingMonthlyExpiry?.toDate?.() ?? null;
  if (expiry && expiry > new Date()) return; // unlimited plan active
  const paid = (d.speakingPaidCredits as number) ?? 0;
  if (paid > 0) await userRef.update({ speakingPaidCredits: FieldValue.increment(-1) });
  else await userRef.update({ speakingFreeUsed: FieldValue.increment(1) });
}

const VALID_TASKS = new Set([
  'read-aloud', 'repeat-sentence', 'describe-image', 'retell-lecture',
  'answer-short-question', 'summarize-group-discussion', 'respond-to-situation',
]);

export async function POST(request: Request) {
  try {
    if (!adminAuth || !adminDb) {
      return Response.json({ error: 'Server not configured.' }, { status: 500 });
    }
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'You must be signed in to use the speaking trainer.', code: 'NO_AUTH' }, { status: 401 });
    }
    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(authHeader.slice(7));
      uid = decoded.uid;
    } catch {
      return Response.json({ error: 'Your session has expired. Please sign in again.', code: 'INVALID_AUTH' }, { status: 401 });
    }

    // Mock exams charge their own credit, so an internal call skips the pool.
    const internal = isInternalRequest(request);
    const cred = internal
      ? ({ ok: true, unlimited: true } as CreditResult)
      : await verifyCredits(uid);
    if (!cred.ok) {
      return Response.json({ error: cred.message, code: cred.code, ...(cred.extra ?? {}) }, { status: cred.status });
    }

    const { taskType, promptText, audioDataUri } = (await request.json()) as {
      taskType?: string; promptText?: string; audioDataUri?: string;
    };
    if (!taskType || !VALID_TASKS.has(taskType)) {
      return Response.json({ error: 'A valid speaking taskType is required.' }, { status: 400 });
    }
    if (!audioDataUri || !audioDataUri.startsWith('data:audio')) {
      return Response.json({ error: 'A base64 audio data URI (data:audio/…) is required.' }, { status: 400 });
    }

    let result;
    try {
      result = await scorePteSpeaking({
        taskType,
        promptText: promptText ?? '',
        audioDataUri,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error('[score-speaking] scoring failed:', msg);
      return Response.json({ error: 'AI scoring failed. Please try again.' }, { status: 502 });
    }

    // Deduct a credit only on a successful scoring (unlimited roles bypass).
    if (!cred.unlimited) {
      try { await deductSpeakingCredit(uid); } catch (e) { console.warn('[score-speaking] credit deduct failed:', e); }
    }

    return Response.json(result);
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[score-speaking] error:', error);
    return Response.json({ error: `Internal error: ${msg}` }, { status: 500 });
  }
}
