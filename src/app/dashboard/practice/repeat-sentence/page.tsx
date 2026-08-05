'use client';

import { Volume2 } from 'lucide-react';
import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteRepeatSentenceData } from '@/lib/pte-speaking-repeat-sentence-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function RepeatSentencePage() {
  const task = getTaskByType('repeat-sentence');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="repeat-sentence"
        title="Repeat Sentence"
        subtitle="Listen to the sentence, then repeat it exactly in one smooth flow."
        color={task?.color ?? 'violet'}
        weight={task?.weight ?? '7%'}
        questions={pteRepeatSentenceData}
        getPromptText={(q) => q.text}
        speakPrompt={(q) => q.text}
        renderPrompt={() => (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
            <Volume2 className="h-8 w-8" />
            <p className="text-sm">Press <b>Start</b> — the sentence will play once. Repeat it right after.</p>
          </div>
        )}
        searchText={(q) => q.text}
        prepSeconds={2}
        recordSeconds={15}
        instructions="Listen and repeat"
      />
    </div>
  );
}
