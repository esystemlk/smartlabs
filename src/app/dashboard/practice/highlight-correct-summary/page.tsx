'use client';

import { ListeningTrainer } from '@/components/pte/listening-trainer';
import { pteListeningHighlightCorrectSummaryData } from '@/lib/pte-listening-highlight-correct-summary-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function HighlightCorrectSummaryPage() {
  const task = getTaskByType('highlight-correct-summary');
  return (
    <ListeningTrainer
      variant="summary"
      title="Highlight Correct Summary"
      subtitle="Listen to the recording, then choose the summary that best matches it."
      color={task?.color ?? 'cyan'}
      weight={task?.weight ?? '2%'}
      instructions="Play the audio, then pick the summary that best captures it."
      questions={pteListeningHighlightCorrectSummaryData}
    />
  );
}
