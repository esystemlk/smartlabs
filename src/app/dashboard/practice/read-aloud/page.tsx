'use client';

import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteReadAloudData } from '@/lib/pte-speaking-read-aloud-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function ReadAloudPage() {
  const task = getTaskByType('read-aloud');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="read-aloud"
        title="Read Aloud"
        subtitle="Read the passage aloud, clearly and at a natural pace."
        color={task?.color ?? 'orange'}
        weight={task?.weight ?? '4%'}
        questions={pteReadAloudData}
        getPromptText={(q) => q.text}
        renderPrompt={(q) => <p className="text-lg leading-relaxed md:text-xl">{q.text}</p>}
        searchText={(q) => q.text}
        prepSeconds={35}
        recordSeconds={40}
        instructions="Read the passage aloud"
      />
    </div>
  );
}
