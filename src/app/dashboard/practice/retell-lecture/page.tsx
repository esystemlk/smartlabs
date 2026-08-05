'use client';

import { Headphones } from 'lucide-react';
import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteRetellLectureData } from '@/lib/pte-speaking-retell-lecture-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function RetellLecturePage() {
  const task = getTaskByType('retell-lecture');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="retell-lecture"
        title="Retell Lecture"
        subtitle="Listen to the lecture, then retell it in your own words with the main points."
        color={task?.color ?? 'emerald'}
        weight={task?.weight ?? '6%'}
        questions={pteRetellLectureData}
        getPromptText={(q) => q.transcript}
        speakPrompt={(q) => q.transcript}
        renderPrompt={(q) => (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
            <Headphones className="h-8 w-8 text-muted-foreground" />
            <p className="font-semibold">{q.title}</p>
            <p className="text-sm text-muted-foreground">Press <b>Start</b> to hear the lecture, then retell it after a short prep.</p>
          </div>
        )}
        searchText={(q) => q.title}
        prepSeconds={10}
        recordSeconds={40}
        instructions="Listen to the lecture, then retell"
      />
    </div>
  );
}
