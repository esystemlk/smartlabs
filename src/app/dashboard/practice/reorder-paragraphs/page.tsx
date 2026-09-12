'use client';

import { ReadingTrainer } from '@/components/pte/reading-trainer';
import { pteReadingReorderParagraphsData } from '@/lib/pte-reading-reorder-paragraphs-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ReadingReorderParagraphsPage() {
  const task = getTaskByType('reorder-paragraphs');
  return (
    <div className="py-4 md:py-6">
      <ReadingTrainer
        variant="reorder"
        title="Re-order Paragraphs"
        subtitle="The text boxes are in the wrong order — restore the original sequence."
        color={task?.color ?? 'lime'}
        weight={task?.weight ?? '9%'}
        instructions="Drag the boxes into the correct order"
        questions={pteReadingReorderParagraphsData}
      />
    </div>
  );
}
