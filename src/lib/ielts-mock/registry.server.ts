import 'server-only';
import { gradeReadingAnswer } from '@/lib/ielts-reading/grading';

// Listening data + answer keys
import l21t1 from '@/lib/ielts-listening/cambridge-21-test-1.json';
import l21t2 from '@/lib/ielts-listening/cambridge-21-test-2.json';
import l20t1 from '@/lib/ielts-listening/cambridge-20-test-1.json';
import l20t2 from '@/lib/ielts-listening/cambridge-20-test-2.json';
import { answerKey as k_l21t1 } from '@/lib/ielts-listening/answer-key-cam21-test-1.server';
import { answerKey as k_l21t2 } from '@/lib/ielts-listening/answer-key-cam21-test-2.server';
import { answerKey as k_l20t1 } from '@/lib/ielts-listening/answer-key-cam20-test-1.server';
import { answerKey as k_l20t2 } from '@/lib/ielts-listening/answer-key-cam20-test-2.server';

// Reading data + answer keys
import r20t1 from '@/lib/ielts-reading/cambridge-20-test-1.json';
import r19t1 from '@/lib/ielts-reading/cambridge-19-test-1.json';
import r18t1 from '@/lib/ielts-reading/cambridge-18-test-1.json';
import r17t1 from '@/lib/ielts-reading/cambridge-17-test-1.json';
import { answerKey as k_r20t1 } from '@/lib/ielts-reading/answer-key-cambridge-20-test-1.server';
import { answerKey as k_r19t1 } from '@/lib/ielts-reading/answer-key-cambridge-19-test-1.server';
import { answerKey as k_r18t1 } from '@/lib/ielts-reading/answer-key-cambridge-18-test-1.server';
import { answerKey as k_r17t1 } from '@/lib/ielts-reading/answer-key-cambridge-17-test-1.server';

type AnswerKey = Record<string, string[]>;
interface TestBundle {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: { questions: Array<{ id: number; kind: string; wordLimit?: number }> } & any;
  key: AnswerKey;
}

const LISTENING: Record<string, TestBundle> = {
  'cambridge-21-test-1': { data: l21t1, key: k_l21t1 },
  'cambridge-21-test-2': { data: l21t2, key: k_l21t2 },
  'cambridge-20-test-1': { data: l20t1, key: k_l20t1 },
  'cambridge-20-test-2': { data: l20t2, key: k_l20t2 },
};

const READING: Record<string, TestBundle> = {
  'cambridge-20-test-1': { data: r20t1, key: k_r20t1 },
  'cambridge-19-test-1': { data: r19t1, key: k_r19t1 },
  'cambridge-18-test-1': { data: r18t1, key: k_r18t1 },
  'cambridge-17-test-1': { data: r17t1, key: k_r17t1 },
};

export function getListeningBundle(testId: string): TestBundle | undefined { return LISTENING[testId]; }
export function getReadingBundle(testId: string): TestBundle | undefined { return READING[testId]; }

/** Grade a submitted answer map against a test's key. Returns raw correct / total. */
export function gradeTest(bundle: TestBundle, answers: Record<string, unknown>): { raw: number; total: number } {
  const gradable = bundle.data.questions.filter((q: { id: number; kind: string; wordLimit?: number }) => q.kind !== 'unavailable');
  let raw = 0;
  for (const q of gradable) {
    const accepted = bundle.key[q.id];
    if (!accepted) continue;
    const value = answers?.[q.id];
    if (typeof value !== 'string') continue;
    const limit = q.kind === 'choice' ? 2 : q.wordLimit ?? 2;
    if (gradeReadingAnswer(value, accepted, limit)) raw += 1;
  }
  return { raw, total: gradable.length };
}
