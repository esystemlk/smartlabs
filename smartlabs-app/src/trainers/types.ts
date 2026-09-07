import type { PteTask } from '@/api/questions';

export type AnyQuestion = Record<string, unknown> & { id?: string };

export interface TrainerProps {
  task: PteTask;
  question: AnyQuestion;
  /** Advance to the next question (also resets the trainer). */
  onNext: () => void;
}
