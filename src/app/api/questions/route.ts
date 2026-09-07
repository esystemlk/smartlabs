import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { getQuestionBank, QUESTION_BANK_TYPES } from '@/lib/question-bank';
import { PTE_CATALOG } from '@/lib/pte-catalog';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Read-only question endpoint for the mobile app.
 *
 *   GET /api/questions?catalog=1        → the full PTE catalogue (menu)
 *   GET /api/questions?type=read-aloud  → live questions for one task type
 *   GET /api/questions                  → the list of known task types
 *
 * Source of truth is the admin-managed Firestore bank `pte_questions` (the same
 * pool the website trainers and mock tests use) — so every question added in the
 * admin dashboard appears in the app automatically. If the DB has no active
 * questions for a task yet, we fall back to the built-in seed bank so the app is
 * never empty. `source` in the response says which was used.
 *
 * Requires a valid Firebase ID token, same as the other app endpoints.
 */

// A few catalog task ids differ from the Firestore `taskType` slug.
const DB_TASKTYPE: Record<string, string> = {
  sst: 'summarize-spoken-text',
  wfd: 'write-from-dictation',
};

// section for each catalog task (derived from the catalogue).
const SECTION_BY_TASK: Record<string, string> = (() => {
  const m: Record<string, string> = {};
  for (const s of PTE_CATALOG) for (const t of s.tasks) m[t.taskType] = s.id;
  return m;
})();

/** Which field the app trainer reads the main prompt from, per task type. */
function contentField(taskType: string): string {
  switch (taskType) {
    case 'swt': return 'passage';
    case 'write-essay': return 'topic';
    case 'sst':
    case 'retell-lecture':
    case 'summarize-group-discussion': return 'transcript';
    case 'answer-short-question': return 'question';
    case 'respond-to-situation': return 'situation';
    case 'describe-image': return 'describe';
    default: return 'text'; // read-aloud, repeat-sentence, wfd, …
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDoc(taskType: string, id: string, d: any): Record<string, unknown> {
  const q: Record<string, unknown> = {
    id,
    title: d.title ?? '',
    [contentField(taskType)]: String(d.content ?? ''),
  };
  if (d.audioUrl) q.audioUrl = d.audioUrl;
  if (d.category) q.category = d.category;
  if (d.svg) q.svg = d.svg; // describe-image image, when present
  return q;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toMillis(v: any): number {
  return v?.toMillis?.() ?? 0;
}

async function fetchFromDb(taskType: string): Promise<Record<string, unknown>[] | null> {
  if (!adminDb) return null;
  const section = SECTION_BY_TASK[taskType];
  if (!section) return null;
  const dbTask = DB_TASKTYPE[taskType] ?? taskType;
  // Filter section+taskType server-side; active + sort client-side to avoid a
  // composite index (same approach as the website's question service).
  const snap = await adminDb
    .collection('pte_questions')
    .where('section', '==', section)
    .where('taskType', '==', dbTask)
    .get();
  const docs = snap.docs
    .map((doc) => ({ id: doc.id, d: doc.data() }))
    .filter((x) => x.d.active !== false)
    .sort((a, b) => toMillis(b.d.createdAt) - toMillis(a.d.createdAt));
  if (!docs.length) return null;
  return docs.map((x) => normalizeDoc(taskType, x.id, x.d));
}

export async function POST() {
  return Response.json({ error: 'Use GET.' }, { status: 405 });
}

export async function GET(request: Request) {
  if (!adminAuth) {
    return Response.json({ error: 'Server not configured.' }, { status: 500 });
  }
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return Response.json({ error: 'Unauthorized — sign in required.' }, { status: 401 });
  }
  try {
    await adminAuth.verifyIdToken(authHeader.slice(7));
  } catch {
    return Response.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);

  if (searchParams.get('catalog')) {
    return Response.json({ catalog: PTE_CATALOG });
  }

  const type = searchParams.get('type');
  if (!type) {
    return Response.json({ types: QUESTION_BANK_TYPES });
  }

  // 1) Live admin-managed bank (Firestore).
  let questions: readonly unknown[] | null = null;
  let source: 'db' | 'seed' = 'seed';
  try {
    const dbQuestions = await fetchFromDb(type);
    if (dbQuestions && dbQuestions.length) {
      questions = dbQuestions;
      source = 'db';
    }
  } catch (e) {
    console.warn('[questions] DB read failed, falling back to seed:', e);
  }

  // 2) Seed bank fallback (built-in samples) when the DB has none yet.
  if (!questions) {
    const bank = getQuestionBank(type);
    if (!bank) {
      return Response.json(
        { error: `No question bank for task type "${type}".`, availableTypes: QUESTION_BANK_TYPES },
        { status: 404 },
      );
    }
    questions = bank;
  }

  return Response.json({ type, source, count: questions.length, questions });
}
