import { apiGet } from '@/api/client';

export type PteScoring = 'ai' | 'auto';
export type PteInput = 'mic' | 'text' | 'choice' | 'order' | 'blank';

export interface PteTask {
  taskType: string;
  label: string;
  slug: string;
  scoring: PteScoring;
  weight: string;
  isNew?: boolean;
  built?: boolean;
  input: PteInput;
  color: string;
}

export interface PteSection {
  id: 'speaking' | 'writing' | 'reading' | 'listening';
  label: string;
  color: string;
  tasks: PteTask[];
}

/** The full PTE catalogue — same source the website mega-menu reads. */
export function fetchCatalog() {
  return apiGet<{ catalog: PteSection[] }>('/api/questions?catalog=1');
}

/** The seed question bank for one task type. */
export function fetchQuestions<T = unknown>(taskType: string) {
  return apiGet<{ type: string; count: number; questions: T[] }>(
    `/api/questions?type=${encodeURIComponent(taskType)}`,
  );
}
