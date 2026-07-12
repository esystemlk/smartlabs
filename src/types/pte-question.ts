// Question bank shared types for the PTE trainers (admin-managed, Firestore).

export type PteSection = 'speaking' | 'writing' | 'reading' | 'listening';

export interface PteQuestion {
  id?: string;
  section: PteSection;
  /** e.g. 'swt' (Summarize Written Text), 'write-essay' */
  taskType: string;
  /** Short label/title shown in admin lists */
  title: string;
  /** Main content — SWT: the source passage; Write Essay: the topic prompt; SST: the lecture transcript */
  content: string;
  /** Optional grouping (e.g. essay category) */
  category?: string;
  /** Public URL of the lecture audio (MP3) — used by Summarize Spoken Text (SST). */
  audioUrl?: string;
  active: boolean;
  createdAt?: unknown;
  updatedAt?: unknown;
}
