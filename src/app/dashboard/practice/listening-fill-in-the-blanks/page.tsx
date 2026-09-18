'use client';

import { ListeningTrainer } from '@/components/pte/listening-trainer';
import { pteListeningFillInBlanksData } from '@/lib/pte-listening-fill-in-blanks-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ListeningFillBlanksPage() {
  const task = getTaskByType('listening-fill-blanks');
  return (
    <ListeningTrainer
      variant="fill-blanks"
      title="Fill in the Blanks"
      subtitle="Listen to the recording, then type the missing words into the transcript."
      color={task?.color ?? 'indigo'}
      weight={task?.weight ?? '8%'}
      instructions="Play the audio, then fill each blank with the exact word you heard."
      questions={pteListeningFillInBlanksData}
    />
  );
}
