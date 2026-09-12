'use client';

import { ReadingTrainer } from '@/components/pte/reading-trainer';
import { pteReadingFillInBlanksDragDropData } from '@/lib/pte-reading-fill-in-blanks-drag-drop-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ReadingFillInBlanksDragDropPage() {
  const task = getTaskByType('fill-blanks');
  return (
    <div className="py-4 md:py-6">
      <ReadingTrainer
        variant="dragdrop"
        title="Fill in the Blanks (Drag & Drop)"
        subtitle="Drag words from the bank into the blanks to complete the passage."
        color={task?.color ?? 'green'}
        weight={task?.weight ?? '20%'}
        instructions="Tap a word to drop it into the next blank — tap a blank to send its word back"
        questions={pteReadingFillInBlanksDragDropData}
      />
    </div>
  );
}
