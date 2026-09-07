import { apiPost } from '@/api/client';

/**
 * Synthesize speech for listening prompts. Returns a base64 MP3 which the caller
 * turns into a `data:audio/mp3;base64,…` URI for expo-av playback.
 */
export async function synthesizeSpeech(text: string, voice?: string): Promise<string> {
  const { audio } = await apiPost<{ audio: string }>('/api/tts', { text, voice });
  return `data:audio/mp3;base64,${audio}`;
}
