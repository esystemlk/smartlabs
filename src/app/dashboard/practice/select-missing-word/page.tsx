'use client';

import { ListeningTrainer } from '@/components/pte/listening-trainer';
import { pteListeningSelectMissingWordData } from '@/lib/pte-listening-select-missing-word-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function SelectMissingWordPage() {
  const task = getTaskByType('select-missing-word');
  return (
    <ListeningTrainer
      variant="missing-word"
      title="Select Missing Word"
      subtitle="Listen to the recording — the last word is replaced by a beep. Choose the word that completes it."
      color={task?.color ?? 'sky'}
      weight={task?.weight ?? '1%'}
      instructions="Play the audio, then choose the word that best completes the sentence."
      questions={pteListeningSelectMissingWordData}
    />
  );
}
