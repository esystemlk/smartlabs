/**
 * Central registry mapping every PTE `taskType` to its seed question bank.
 *
 * This is the single source of truth the mobile app reads through
 * `GET /api/questions` so the web trainers and the app always show the same
 * questions. The website's own pages import the individual data files directly;
 * this registry simply re-exposes them keyed by the stable `taskType` id used in
 * `pte-catalog.ts`.
 *
 * NOTE: `reading-mcq-single` has no dedicated seed bank yet, so it is absent
 * here (the API returns 404 for it) until its data source is finalised.
 */

import { pteReadAloudData } from '@/lib/pte-speaking-read-aloud-data';
import { pteRepeatSentenceData } from '@/lib/pte-speaking-repeat-sentence-data';
import { pteDescribeImageData } from '@/lib/pte-speaking-describe-image-data';
import { pteRetellLectureData } from '@/lib/pte-speaking-retell-lecture-data';
import { pteAnswerShortQuestionData } from '@/lib/pte-speaking-answer-short-question-data';
import { pteSummarizeGroupDiscussionData } from '@/lib/pte-speaking-summarize-group-discussion-data';
import { pteRespondToSituationData } from '@/lib/pte-speaking-respond-to-situation-data';

import { pteSummarizeWrittenTextData } from '@/lib/pte-writing-summarize-written-text-data';
import { pteWriteEssayData } from '@/lib/pte-writing-write-essay-data';

import { pteReadingFillInBlanksDropdownData } from '@/lib/pte-reading-fill-in-blanks-dropdown-data';
import { pteReadingMultipleChoiceMultipleAnswerData } from '@/lib/pte-reading-multiple-choice-multiple-answer-data';
import { pteReadingReorderParagraphsData } from '@/lib/pte-reading-reorder-paragraphs-data';
import { pteReadingFillInBlanksDragDropData } from '@/lib/pte-reading-fill-in-blanks-drag-drop-data';

import { pteSummarizeSpokenTextData } from '@/lib/pte-listening-summarize-spoken-text-data';
import { pteWriteFromDictationData } from '@/lib/pte-listening-write-from-dictation-data';
import { pteListeningMultipleChoiceMultipleAnswerData } from '@/lib/pte-listening-multiple-choice-multiple-answer-data';
import { pteListeningFillInBlanksData } from '@/lib/pte-listening-fill-in-blanks-data';
import { pteListeningHighlightCorrectSummaryData } from '@/lib/pte-listening-highlight-correct-summary-data';
import { pteListeningMultipleChoiceSingleAnswerData } from '@/lib/pte-listening-multiple-choice-single-answer-data';
import { pteListeningSelectMissingWordData } from '@/lib/pte-listening-select-missing-word-data';
import { pteListeningHighlightIncorrectWordsData } from '@/lib/pte-listening-highlight-incorrect-words-data';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const QUESTION_BANK: Record<string, readonly any[]> = {
  // ── Speaking ──
  'read-aloud': pteReadAloudData,
  'repeat-sentence': pteRepeatSentenceData,
  'describe-image': pteDescribeImageData,
  'retell-lecture': pteRetellLectureData,
  'answer-short-question': pteAnswerShortQuestionData,
  'summarize-group-discussion': pteSummarizeGroupDiscussionData,
  'respond-to-situation': pteRespondToSituationData,

  // ── Writing ──
  'swt': pteSummarizeWrittenTextData,
  'write-essay': pteWriteEssayData,

  // ── Reading ──
  'rw-fill-blanks': pteReadingFillInBlanksDropdownData,
  'mcq-multiple': pteReadingMultipleChoiceMultipleAnswerData,
  'reorder-paragraphs': pteReadingReorderParagraphsData,
  'fill-blanks': pteReadingFillInBlanksDragDropData,

  // ── Listening ──
  'sst': pteSummarizeSpokenTextData,
  'wfd': pteWriteFromDictationData,
  'listening-mcq-multiple': pteListeningMultipleChoiceMultipleAnswerData,
  'listening-fill-blanks': pteListeningFillInBlanksData,
  'highlight-correct-summary': pteListeningHighlightCorrectSummaryData,
  'listening-mcq-single': pteListeningMultipleChoiceSingleAnswerData,
  'select-missing-word': pteListeningSelectMissingWordData,
  'highlight-incorrect-words': pteListeningHighlightIncorrectWordsData,
};

export const QUESTION_BANK_TYPES = Object.keys(QUESTION_BANK);

export function getQuestionBank(taskType: string): readonly unknown[] | null {
  return QUESTION_BANK[taskType] ?? null;
}
