'use client';

import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { pteDescribeImageData } from '@/lib/pte-speaking-describe-image-data';
import { getTaskByType } from '@/lib/pte-catalog';

export default function DescribeImagePage() {
  const task = getTaskByType('describe-image');
  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="describe-image"
        title="Describe Image"
        subtitle="You have 25s to study the image, then describe what it shows and draw a conclusion."
        color={task?.color ?? 'blue'}
        weight={task?.weight ?? '15%'}
        questions={pteDescribeImageData}
        getPromptText={(q) => q.describe}
        renderPrompt={(q) => (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold">{q.title}</p>
            <div className="w-full max-w-md rounded-xl border bg-white p-3" dangerouslySetInnerHTML={{ __html: q.svg }} />
          </div>
        )}
        searchText={(q) => q.title}
        prepSeconds={25}
        recordSeconds={40}
        instructions="Study the image, then describe it"
      />
    </div>
  );
}
