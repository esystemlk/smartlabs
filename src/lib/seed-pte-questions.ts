import { db } from './firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { TOPICS, PREDICTIONS } from './essay-topics-data';
import { QUESTION_BANK } from './question-bank';

/**
 * One-time migration: seed every hardcoded PTE question bank into the
 * `pte_questions` Firestore collection so questions are DB-managed (admin panel)
 * and read by the trainers/app instead of living in source code.
 *
 * Idempotent — each item uses a deterministic document id, so re-running updates
 * the existing docs instead of creating duplicates.
 *
 * Interactive types (reading/listening MCQ, reorder, fill-in-blanks, etc.) carry
 * structured data (options/answers/paragraphs), so we store the FULL original
 * question object under `data`. The `/api/questions` route returns that object
 * verbatim, so the app/site get the complete question. A `content` string is
 * also stored for search + simple prompt-only types.
 *
 * Requires a staff account (Firestore rules restrict pte_questions writes).
 */
const COL = 'pte_questions';

// The `/api/questions` route remaps a couple of catalog ids to DB task slugs.
// Seed with the SAME slug so the app finds them.
const DB_TASKTYPE: Record<string, string> = {
  sst: 'summarize-spoken-text',
  wfd: 'write-from-dictation',
};

// Section for every QUESTION_BANK task type.
const SECTION: Record<string, 'speaking' | 'writing' | 'reading' | 'listening'> = {
  'read-aloud': 'speaking',
  'repeat-sentence': 'speaking',
  'describe-image': 'speaking',
  'retell-lecture': 'speaking',
  'answer-short-question': 'speaking',
  'summarize-group-discussion': 'speaking',
  'respond-to-situation': 'speaking',
  swt: 'writing',
  'write-essay': 'writing',
  'rw-fill-blanks': 'reading',
  'mcq-multiple': 'reading',
  'reorder-paragraphs': 'reading',
  'fill-blanks': 'reading',
  'reading-mcq-single': 'reading',
  sst: 'listening',
  wfd: 'listening',
  'listening-mcq-multiple': 'listening',
  'listening-fill-blanks': 'listening',
  'highlight-correct-summary': 'listening',
  'listening-mcq-single': 'listening',
  'select-missing-word': 'listening',
  'highlight-incorrect-words': 'listening',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function promptOf(q: any): string {
  for (const k of ['passage', 'topic', 'transcript', 'text', 'question', 'situation', 'describe', 'audioText', 'title']) {
    const v = q?.[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}

const safeId = (s: string) => s.replace(/[^A-Za-z0-9_-]/g, '-');

export interface SeedResult {
  success: boolean;
  predictions: number;
  topics: number;
  error?: string;
}

/** Seed just the essay "Write Essay" topics + predicted questions (curated set). */
export async function seedEssayQuestions(): Promise<SeedResult> {
  try {
    let predictions = 0;
    let topics = 0;
    for (const p of PREDICTIONS) {
      await setDoc(doc(db, COL, `essay-pred-${p.id}`), {
        section: 'writing', taskType: 'write-essay',
        title: `Prediction ${p.no ?? p.id}`, content: p.text, category: p.category,
        group: 'prediction', no: p.no ?? null, active: true, source: 'seed',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true });
      predictions++;
    }
    for (const t of TOPICS) {
      await setDoc(doc(db, COL, `essay-topic-${t.id}`), {
        section: 'writing', taskType: 'write-essay',
        title: `Topic ${t.id}`, content: t.text, category: t.category,
        group: 'topic', active: true, source: 'seed',
        createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
      }, { merge: true });
      topics++;
    }
    return { success: true, predictions, topics };
  } catch (error) {
    return { success: false, predictions: 0, topics: 0, error: error instanceof Error ? error.message : String(error) };
  }
}

export interface AllSeedResult {
  success: boolean;
  perType: Record<string, number>;
  total: number;
  failed: number;
  firstError?: string;
  error?: string;
}

/** Seed EVERY question type (all 23 banks) into `pte_questions`. */
export async function seedAllQuestions(): Promise<AllSeedResult> {
  const perType: Record<string, number> = {};
  let failed = 0;
  let firstError: string | undefined;

  try {
    // Essay is handled from the curated page set (topics + predictions).
    const essay = await seedEssayQuestions();
    if (!essay.success) throw new Error(essay.error ?? 'Essay seed failed');
    perType['write-essay'] = essay.predictions + essay.topics;

    for (const [taskType, bank] of Object.entries(QUESTION_BANK)) {
      if (taskType === 'write-essay') continue; // done above
      const section = SECTION[taskType];
      if (!section) continue;
      const dbTask = DB_TASKTYPE[taskType] ?? taskType;
      let n = 0;
      for (const q of bank as readonly Record<string, unknown>[]) {
        const rawId = q.id != null ? String(q.id) : `${n + 1}`;
        try {
          await setDoc(
            doc(db, COL, `${safeId(dbTask)}__${safeId(rawId)}`),
            {
              section,
              taskType: dbTask,
              title: (q.title as string) ?? '',
              content: promptOf(q),
              category: (q.category as string) ?? null,
              audioUrl: (q.audioUrl as string) ?? null,
              data: q, // full original question (options/answers/paragraphs/etc.)
              active: true,
              source: 'seed',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            },
            { merge: true },
          );
          n++;
        } catch (e) {
          // One oversized/invalid item shouldn't abort the whole migration.
          failed++;
          if (!firstError) firstError = `${dbTask}/${rawId}: ${e instanceof Error ? e.message : String(e)}`;
        }
      }
      perType[taskType] = n;
    }

    const total = Object.values(perType).reduce((a, b) => a + b, 0);
    return { success: true, perType, total, failed, firstError };
  } catch (error) {
    return { success: false, perType, total: 0, failed, firstError, error: error instanceof Error ? error.message : String(error) };
  }
}
