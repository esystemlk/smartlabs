'use client';

import { ListeningTrainer } from '@/components/pte/listening-trainer';
import { pteListeningHighlightIncorrectWordsData } from '@/lib/pte-listening-highlight-incorrect-words-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function HighlightIncorrectWordsPage() {
  const task = getTaskByType('highlight-incorrect-words');
  return (
    <ListeningTrainer
      variant="highlight-words"
      title="Highlight Incorrect Words"
      subtitle="Listen to the recording while reading the transcript, then click the words that differ from the audio."
      color={task?.color ?? 'violet'}
      weight={task?.weight ?? '8%'}
      instructions="Play the audio and read along — click each word in the transcript that does NOT match what you hear."
      questions={pteListeningHighlightIncorrectWordsData}
    />
  );
}
