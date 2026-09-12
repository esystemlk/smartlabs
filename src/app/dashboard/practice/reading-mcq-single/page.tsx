'use client';

import { ReadingTrainer } from '@/components/pte/reading-trainer';
import { pteReadingMultipleChoiceSingleAnswerData } from '@/lib/pte-reading-multiple-choice-single-answer-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ReadingMcqSinglePage() {
  const task = getTaskByType('reading-mcq-single');
  return (
    <div className="py-4 md:py-6">
      <ReadingTrainer
        variant="mcsa"
        title="Multiple Choice (Single)"
        subtitle="Read the passage and select the single best answer."
        color={task?.color ?? 'sky'}
        weight={task?.weight ?? '3%'}
        instructions="Choose the one correct option"
        questions={pteReadingMultipleChoiceSingleAnswerData}
      />
    </div>
  );
}
