'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { SpeakingTrainer } from '@/components/pte/speaking-trainer';
import { getTaskByType } from '@/lib/pte-catalog';
import { listQuestions } from '@/lib/services/pte-questions.service';
import { ImageOff, Loader2 } from 'lucide-react';

type DIItem = { id: string; title: string; describe: string; imageUrl: string };

export default function DescribeImagePage() {
  const task = getTaskByType('describe-image');
  const [questions, setQuestions] = useState<DIItem[] | null>(null); // null = still loading

  // Questions come from the admin-uploaded question bank only — no built-in
  // mock bar charts, so students always describe a real uploaded image and
  // the AI scores that exact picture.
  useEffect(() => {
    let alive = true;
    listQuestions('speaking', 'describe-image', true)
      .then((rows) => {
        if (!alive) return;
        const mapped: DIItem[] = rows
          .map((r) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const d = (r as any).data ?? {};
            return {
              id: r.id ?? d.id ?? Math.random().toString(36).slice(2),
              title: (r.title || d.title || 'Describe Image') as string,
              describe: (d.describe ?? r.content ?? '') as string,
              imageUrl: (d.imageUrl ?? (r as { imageUrl?: string }).imageUrl ?? '') as string,
            };
          })
          .filter((m) => m.imageUrl);
        setQuestions(mapped);
      })
      .catch(() => { if (alive) setQuestions([]); });
    return () => { alive = false; };
  }, []);

  if (questions === null) {
    return (
      <div className="flex h-64 items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading questions…
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <ImageOff className="h-8 w-8" />
        <p className="max-w-sm text-sm">No Describe Image questions are available yet. Please check back once the question bank has been updated.</p>
      </div>
    );
  }

  return (
    <div className="py-4 md:py-6">
      <SpeakingTrainer
        taskType="describe-image"
        title="Describe Image"
        subtitle="You have 25s to study the image, then describe what it shows and draw a conclusion."
        color={task?.color ?? 'blue'}
        weight={task?.weight ?? '15%'}
        questions={questions}
        getPromptText={(q) => q.describe}
        getImageUrl={(q) => q.imageUrl}
        renderPrompt={(q) => (
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm font-semibold">{q.title}</p>
            {/* Protected image: block right-click, drag, long-press-save and selection. */}
            <div
              className="relative w-full max-w-md select-none"
              onContextMenu={(e) => e.preventDefault()}
              onDragStart={(e) => e.preventDefault()}
              style={{ WebkitTouchCallout: 'none', userSelect: 'none', WebkitUserSelect: 'none' } as CSSProperties}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={q.imageUrl}
                alt={q.title}
                draggable={false}
                className="pointer-events-none w-full rounded-xl border bg-white p-3 select-none"
              />
              {/* Transparent overlay absorbs long-press / right-click / drag gestures. */}
              <span aria-hidden="true" className="absolute inset-0 z-10 block" />
            </div>
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
