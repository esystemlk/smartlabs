import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { isInternalRequest } from '@/lib/internal-auth';
import { scorePteSpeaking } from '@/ai/flows/score-pte-speaking';
import { hasCreditFor, deductionFor, type PoolConfig } from '@/lib/services/ai-credits';

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
const SPEAKING_POOL: PoolConfig = { paid: 'speakingPaidCredits', monthly: 'speakingMonthlyExpiry', free: 'speakingFreeUsed', freeLimit: FREE_SPEAKING_LIMIT };

type CreditResult =
  | { ok: true; unlimited: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  | { ok: false; status: number; code: string; message: string; extra?: any };

async function verifyCredits(uid: string): Promise<CreditResult> {
  const snap = await adminDb!.collection('users').doc(uid).get();
  const d = snap.data() ?? {};
  const role = (d.role as string) ?? 'student';
  if (UNLIMITED_ROLES.has(role)) return { ok: true, unlimited: true };
  // Eligible if this pool OR the shared universal pool can cover the use.
  if (hasCreditFor(d, SPEAKING_POOL)) return { ok: true, unlimited: false };
  const freeUsed = (d.speakingFreeUsed as number) ?? 0;
  return {
    ok: false, status: 402, code: 'NO_CREDITS',
    message: freeUsed >= 1
      ? `You have used your ${FREE_SPEAKING_LIMIT} free speaking scorings. Purchase credits to keep practising.`
      : 'Free AI scoring is no longer available on new accounts. Please purchase credits to start scoring.',
    extra: { freeUsed, paidCredits: (d.speakingPaidCredits as number) ?? 0, universalPaidCredits: (d.universalPaidCredits as number) ?? 0 },
  };
}

async function deductSpeakingCredit(uid: string): Promise<void> {
  const userRef = adminDb!.collection('users').doc(uid);
  await adminDb!.runTransaction(async (tx) => {
    const snap = await tx.get(userRef);
    const d = snap.data() ?? {};
    if (UNLIMITED_ROLES.has((d.role as string) ?? 'student')) return;
    const upd = deductionFor(d, SPEAKING_POOL);
    if (upd) tx.update(userRef, upd);
  });
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
