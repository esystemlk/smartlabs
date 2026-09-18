'use client';

import { ListeningTrainer } from '@/components/pte/listening-trainer';
import { pteListeningMultipleChoiceSingleAnswerData } from '@/lib/pte-listening-multiple-choice-single-answer-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ListeningMcqSinglePage() {
  const task = getTaskByType('listening-mcq-single');
  return (
    <ListeningTrainer
      variant="mcsa"
      title="Multiple Choice (Single)"
      subtitle="Listen to the recording, then choose the single best answer."
      color={task?.color ?? 'fuchsia'}
      weight={task?.weight ?? '2%'}
      instructions="Play the audio, then select the one correct answer."
      questions={pteListeningMultipleChoiceSingleAnswerData}
    />
  );
}
