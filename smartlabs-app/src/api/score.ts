import { apiPost } from '@/api/client';

/** Summarize Spoken Text — needs the lecture transcript + the student summary. */
export function scoreSst(input: { transcript: string; summary: string }) {
  return apiPost<Record<string, unknown>>('/api/score-sst', input);
}

/** Summarize Written Text. */
export function scoreSwt(input: { passage: string; summary: string }) {
  return apiPost<Record<string, unknown>>('/api/score-swt', input);
}

/** Write from Dictation — scored server-side against the question's known sentence. */
export function scoreWfd(input: { questionId: string; answer: string }) {
  return apiPost<Record<string, unknown>>('/api/score-wfd', input);
}

/** Write Essay. `topic` is the essay prompt. */
export function scoreEssay(input: {
  topic: string;
  essay: string;
  wordCount?: number;
  requestModelEssay?: boolean;
  targetScore?: number;
}) {
  return apiPost<Record<string, unknown>>('/api/score-essay', input);
}

export interface SpeakingScore {
  transcript: string;
  content: number;
  fluency: number;
  pronunciation: number;
  overall: number;
  contentFeedback: string;
  fluencyFeedback: string;
  pronunciationFeedback: string;
  tips: string[];
}

/**
 * Score any speaking task. `audioDataUri` is a data:audio/…;base64 string built
 * from the recording (see src/audio).
 */
export function scoreSpeaking(input: {
  taskType: string;
  promptText: string;
  audioDataUri: string;
}) {
  return apiPost<SpeakingScore>('/api/score-speaking', input);
}
