'use client';

import { MessageSquare } from 'lucide-react';
import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteRespondToSituationData } from '@/lib/pte-speaking-respond-to-situation-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function RespondToSituationPage() {
  const task = getTaskByType('respond-to-situation');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="respond-to-situation"
        title="Respond to a Situation"
        subtitle="Read the situation, then respond appropriately and naturally."
        color={task?.color ?? 'cyan'}
        weight={task?.weight ?? '13%'}
        questions={pteRespondToSituationData}
        getPromptText={(q) => q.situation}
        renderPrompt={(q) => (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MessageSquare className="h-5 w-5" />
              <span className="text-sm font-semibold">{q.title}</span>
            </div>
            <p className="text-lg leading-relaxed md:text-xl">{q.situation}</p>
          </div>
        )}
        searchText={(q) => q.situation}
        prepSeconds={20}
        recordSeconds={40}
        instructions="Read the situation, then respond"
      />
    </div>
  );
}
