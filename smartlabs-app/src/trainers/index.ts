import type { ComponentType } from 'react';
import type { TrainerProps } from '@/trainers/types';
import { SwtTrainer } from '@/trainers/SwtTrainer';
import { SstTrainer } from '@/trainers/SstTrainer';
import { WfdTrainer } from '@/trainers/WfdTrainer';
import { EssayTrainer } from '@/trainers/EssayTrainer';
import { SpeakingTrainer } from '@/trainers/SpeakingTrainer';

/**
 * Maps a PTE taskType to its trainer component. Types not listed here fall back
 * to the generic viewer in the practice screen (Phase 4 will fill these in).
 */
export const TRAINERS: Record<string, ComponentType<TrainerProps>> = {
  // Writing / Listening (AI + deterministic)
  swt: SwtTrainer,
  sst: SstTrainer,
  wfd: WfdTrainer,
  'write-essay': EssayTrainer,
  // Speaking (all mic-based, AI-scored via /api/score-speaking)
  'read-aloud': SpeakingTrainer,
  'repeat-sentence': SpeakingTrainer,
  'describe-image': SpeakingTrainer,
  'retell-lecture': SpeakingTrainer,
  'answer-short-question': SpeakingTrainer,
  'summarize-group-discussion': SpeakingTrainer,
  'respond-to-situation': SpeakingTrainer,
};

export function trainerFor(taskType: string): ComponentType<TrainerProps> | null {
  return TRAINERS[taskType] ?? null;
}

/** True when a task has a working trainer (otherwise it's shown but disabled). */
export function isImplemented(taskType: string): boolean {
  return taskType in TRAINERS;
}
