import type { ComponentType } from 'react';
import type { TrainerProps } from '@/trainers/types';
import { SwtTrainer } from '@/trainers/SwtTrainer';
import { SstTrainer } from '@/trainers/SstTrainer';
import { WfdTrainer } from '@/trainers/WfdTrainer';
import { EssayTrainer } from '@/trainers/EssayTrainer';

/**
 * Maps a PTE taskType to its trainer component. Types not listed here fall back
 * to the generic viewer in the practice screen (Phase 4 will fill these in).
 */
export const TRAINERS: Record<string, ComponentType<TrainerProps>> = {
  swt: SwtTrainer,
  sst: SstTrainer,
  wfd: WfdTrainer,
  'write-essay': EssayTrainer,
};

export function trainerFor(taskType: string): ComponentType<TrainerProps> | null {
  return TRAINERS[taskType] ?? null;
}
