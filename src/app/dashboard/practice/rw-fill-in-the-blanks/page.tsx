'use client';

import { ReadingTrainer } from '@/components/pte/reading-trainer';
import { pteReadingFillInBlanksDropdownData } from '@/lib/pte-reading-fill-in-blanks-dropdown-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ReadingFillInBlanksRWPage() {
  const task = getTaskByType('rw-fill-blanks');
  return (
    <div className="py-4 md:py-6">
      <ReadingTrainer
        variant="dropdown"
        title="Fill in the Blanks (R&W)"
        subtitle="Choose the word that best fits each blank in the passage."
        color={task?.color ?? 'emerald'}
        weight={task?.weight ?? '25%'}
        instructions="Select the correct option for every gap"
        questions={pteReadingFillInBlanksDropdownData}
      />
    </div>
  );
}
