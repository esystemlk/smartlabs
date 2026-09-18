'use client';

import { ListeningTrainer } from '@/components/pte/listening-trainer';
import { pteListeningMultipleChoiceMultipleAnswerData } from '@/lib/pte-listening-multiple-choice-multiple-answer-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ListeningMcqMultiplePage() {
  const task = getTaskByType('listening-mcq-multiple');
  return (
    <ListeningTrainer
      variant="mcma"
      title="Multiple Choice (Multiple)"
      subtitle="Listen to the recording, then select all answers that apply."
      color={task?.color ?? 'rose'}
      weight={task?.weight ?? '3%'}
      instructions="Play the audio, then select every correct answer."
      questions={pteListeningMultipleChoiceMultipleAnswerData}
    />
  );
}
