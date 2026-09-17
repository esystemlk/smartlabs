import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getQuestionBank } from '../question-bank';

/**
 * Bulk-upload helper for the admin question bank. Accepts an array of question
 * objects (in each task type's native JSON shape) and writes them to
 * `pte_questions`, storing the full object under `data` — exactly like the seed
 * — so the app and website read complete questions from the DB.
 */
const COL = 'pte_questions';

// A couple of catalog ids map to different DB task slugs.
const DB_TASKTYPE: Record<string, string> = {
  sst: 'summarize-spoken-text',
  wfd: 'write-from-dictation',
};

/** Uploadable task types, grouped by section, for the admin selectors. */
export const TASK_OPTIONS: { section: 'speaking' | 'writing' | 'reading' | 'listening'; taskType: string; label: string }[] = [
  { section: 'speaking', taskType: 'read-aloud', label: 'Read Aloud' },
  { section: 'speaking', taskType: 'repeat-sentence', label: 'Repeat Sentence' },
  { section: 'speaking', taskType: 'describe-image', label: 'Describe Image' },
  { section: 'speaking', taskType: 'retell-lecture', label: 'Retell Lecture' },
  { section: 'speaking', taskType: 'answer-short-question', label: 'Answer Short Question' },
  { section: 'speaking', taskType: 'summarize-group-discussion', label: 'Summarize Group Discussion' },
  { section: 'speaking', taskType: 'respond-to-situation', label: 'Respond to a Situation' },
  { section: 'writing', taskType: 'swt', label: 'Summarize Written Text' },
  { section: 'writing', taskType: 'write-essay', label: 'Write Essay' },
  { section: 'reading', taskType: 'rw-fill-blanks', label: 'R&W Fill in the Blanks' },
  { section: 'reading', taskType: 'mcq-multiple', label: 'Reading MCQ (multiple)' },
  { section: 'reading', taskType: 'reorder-paragraphs', label: 'Reorder Paragraphs' },
  { section: 'reading', taskType: 'fill-blanks', label: 'Reading Fill in the Blanks' },
  { section: 'reading', taskType: 'reading-mcq-single', label: 'Reading MCQ (single)' },
  { section: 'listening', taskType: 'sst', label: 'Summarize Spoken Text' },
  { section: 'listening', taskType: 'wfd', label: 'Write from Dictation' },
  { section: 'listening', taskType: 'listening-mcq-multiple', label: 'Listening MCQ (multiple)' },
  { section: 'listening', taskType: 'listening-fill-blanks', label: 'Listening Fill in the Blanks' },
  { section: 'listening', taskType: 'highlight-correct-summary', label: 'Highlight Correct Summary' },
  { section: 'listening', taskType: 'listening-mcq-single', label: 'Listening MCQ (single)' },
  { section: 'listening', taskType: 'select-missing-word', label: 'Select Missing Word' },
  { section: 'listening', taskType: 'highlight-incorrect-words', label: 'Highlight Incorrect Words' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function promptOf(q: any): string {
  for (const k of ['passage', 'topic', 'transcript', 'text', 'question', 'situation', 'describe', 'audioText', 'title']) {
    const v = q?.[k];
    if (typeof v === 'string' && v.trim()) return v;
  }
  return '';
}
const safeId = (s: string) => String(s).replace(/[^A-Za-z0-9_-]/g, '-');

/** A couple of real sample items for the selected task type — used as the
 * downloadable example so admins see the exact JSON shape to upload. */
export function exampleForTask(taskType: string): unknown[] {
  const bank = (getQuestionBank(taskType) ?? []) as unknown[];
  if (bank.length) return bank.slice(0, 2);
  // Fallback minimal example for a type with no seed data.
  return [{ id: 'sample-1', title: 'Sample title', text: 'Sample prompt text.', category: 'General' }];
}

export interface BulkResult {
  success: boolean;
  added: number;
  failed: number;
  firstError?: string;
}

/**
 * Write an array of question objects to `pte_questions`.
 * @param opts.isPrediction  for write-essay: mark items as predictions.
 */
export async function bulkAddQuestions(
  section: string,
  taskType: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  items: any[],
  opts: { isPrediction?: boolean } = {},
): Promise<BulkResult> {
  const dbTask = DB_TASKTYPE[taskType] ?? taskType;
  let added = 0;
  let failed = 0;
  let firstError: string | undefined;

  for (let i = 0; i < items.length; i++) {
    const item = items[i] ?? {};
    try {
      let id: string;
      let payload: Record<string, unknown>;

      if (taskType === 'write-essay') {
        const grp = opts.isPrediction ? 'prediction' : 'topic';
        const key = item.id != null ? String(item.id) : `${Date.now()}-${i}`;
        id = `essay-${grp === 'prediction' ? 'pred' : 'topic'}-${safeId(key)}`;
        payload = {
          section: 'writing',
          taskType: 'write-essay',
          title: (item.title as string) || `${grp === 'prediction' ? 'Prediction' : 'Topic'} ${item.no ?? item.id ?? i + 1}`,
          content: (item.text as string) ?? (item.content as string) ?? '',
          category: (item.category as string) ?? null,
          group: grp,
          no: item.no ?? null,
          active: true,
          source: 'bulk',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      } else {
        const key = item.id != null ? String(item.id) : `${Date.now()}-${i}`;
        id = `${safeId(dbTask)}__${safeId(key)}`;
        payload = {
          section,
          taskType: dbTask,
          title: (item.title as string) ?? '',
          content: promptOf(item),
          category: (item.category as string) ?? null,
          audioUrl: (item.audioUrl as string) ?? null,
          data: item,
          active: true,
          source: 'bulk',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };
      }

      await setDoc(doc(db, COL, id), payload, { merge: true });
      added++;
    } catch (e) {
      failed++;
      if (!firstError) firstError = `item ${i + 1}: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return { success: failed === 0, added, failed, firstError };
}
