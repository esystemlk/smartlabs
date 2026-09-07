import type { PteTask } from '@/api/questions';

export type AnyQuestion = Record<string, unknown> & { id?: string };

export interface TrainerProps {
  task: PteTask;
  question: AnyQuestion;
  /** The task's accent colour (from the catalogue), used throughout the trainer. */
  accent: string;
  /** Return to the question list (also resets the trainer). */
  onBack: () => void;
}
