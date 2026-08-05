'use client';

import { MessageCircleQuestion } from 'lucide-react';
import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteAnswerShortQuestionData } from '@/lib/pte-speaking-answer-short-question-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function AnswerShortQuestionPage() {
  const task = getTaskByType('answer-short-question');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="answer-short-question"
        title="Answer Short Question"
        subtitle="Listen to the question and answer with a single word or short phrase."
        color={task?.color ?? 'rose'}
        weight={task?.weight ?? '2%'}
        questions={pteAnswerShortQuestionData}
        getPromptText={(q) => `Question: ${q.question}\nExpected answer: ${q.answer}`}
        speakPrompt={(q) => q.question}
        renderPrompt={() => (
          <div className="flex flex-col items-center justify-center gap-2 py-6 text-center text-muted-foreground">
            <MessageCircleQuestion className="h-8 w-8" />
            <p className="text-sm">Press <b>Start</b> — you’ll hear a short question. Answer immediately in a few words.</p>
          </div>
        )}
        searchText={(q) => q.question}
        prepSeconds={2}
        recordSeconds={10}
        instructions="Listen and answer briefly"
      />
    </div>
  );
}
