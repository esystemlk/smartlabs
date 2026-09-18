'use client';

import { Headphones } from 'lucide-react';
import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteSummarizeGroupDiscussionData } from '@/lib/pte-speaking-summarize-group-discussion-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function SummarizeGroupDiscussionPage() {
  const task = getTaskByType('summarize-group-discussion');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="summarize-group-discussion"
        title="Summarize Group Discussion"
        subtitle="Listen to the discussion, then summarize the speakers' main points and how they relate."
        color={task?.color ?? 'amber'}
        weight={task?.weight ?? '19%'}
        questions={pteSummarizeGroupDiscussionData}
        getPromptText={(q) => q.transcript}
        speakPrompt={(q) => q.transcript}
        renderPrompt={(q) => (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Headphones className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">{q.title}</p>
            <p className="text-sm text-muted-foreground">Press <b>Start</b> to hear the discussion, then summarize it after a short prep.</p>
          </div>
        )}
        searchText={(q) => q.title}
        prepSeconds={10}
        recordSeconds={40}
        instructions="Listen to the discussion, then summarize"
      />
    </div>
  );
}
