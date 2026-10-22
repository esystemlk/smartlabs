import type { SpeakingScore } from '@/ai/flows/score-pte-speaking';

export const MAX_SPEAKING_AUDIO_BYTES = 4 * 1024 * 1024;
export const SPEAKING_TASKS = ['read-aloud', 'repeat-sentence', 'describe-image', 'retell-lecture', 'answer-short-question', 'respond-to-situation', 'summarize-group-discussion'] as const;
export interface SpeakingRecording {
  id: string;
  taskType: string;
  title: string;
  questionId: string;
  questionLabel: string;
  source: 'microphone' | 'upload';
  createdAt: number;
  mimeType: string;
  status: 'saved' | 'scoring' | 'scored' | 'failed';
  score?: SpeakingScore;
}

/** Check the container signature as well as the claimed MIME type. */
export function detectSpeakingAudio(bytes: Uint8Array, declared: string): string | null {
  const type = declared.split(';')[0].toLowerCase();
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes.length < 12) return null;
  if (['audio/webm', 'audio/ogg', 'audio/wav', 'audio/x-wav', 'audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a'].includes(type)) {
    if (type === 'audio/webm' && bytes[0] === 0x1a && bytes[1] === 0x45 && bytes[2] === 0xdf && bytes[3] === 0xa3) return type;
    if (type === 'audio/ogg' && ascii(0, 4) === 'OggS') return type;
    if (['audio/wav', 'audio/x-wav'].includes(type) && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WAVE') return 'audio/wav';
    if (['audio/mpeg', 'audio/mp3'].includes(type) && (ascii(0, 3) === 'ID3' || (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))) return 'audio/mpeg';
    if (['audio/mp4', 'audio/m4a', 'audio/x-m4a'].includes(type) && ascii(4, 8) === 'ftyp') return 'audio/mp4';
  }
  return null;
}
