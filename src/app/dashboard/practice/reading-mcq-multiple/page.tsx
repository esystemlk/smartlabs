'use client';

import { ReadingTrainer } from '@/components/pte/reading-trainer';
import { pteReadingMultipleChoiceMultipleAnswerData } from '@/lib/pte-reading-multiple-choice-multiple-answer-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ReadingMcqMultiplePage() {
  const task = getTaskByType('mcq-multiple');
  return (
    <div className="py-4 md:py-6">
      <ReadingTrainer
        variant="mcma"
        title="Multiple Choice (Multiple)"
        subtitle="Read the passage and select every answer that applies."
        color={task?.color ?? 'teal'}
        weight={task?.weight ?? '5%'}
        instructions="Choose all correct options"
        questions={pteReadingMultipleChoiceMultipleAnswerData}
      />
    </div>
  );
}
