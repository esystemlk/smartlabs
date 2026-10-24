import { createHash } from 'crypto';
import { z } from 'genkit';
import { callWithFallback } from '@/ai/genkit';
import { adminDb } from '@/lib/firebase-admin';

/** Prepare missing reference text without modifying any existing scoring flow or rubric. */
export async function repeatSentenceReference(audioUrl: string): Promise<string> {
  if (!audioUrl) throw new Error('Missing reference audio.');
  const ref = adminDb!.collection('pte_full_mock_references').doc(createHash('sha256').update(audioUrl).digest('hex'));
  const cached = await ref.get();
  if (cached.data()?.transcript) return cached.data()!.transcript;
  const response = await fetch(audioUrl,{signal:AbortSignal.timeout(30000)});
  if (!response.ok) throw new Error('Could not load reference audio.');
  const uri = `data:audio/mpeg;base64,${Buffer.from(await response.arrayBuffer()).toString('base64')}`;
  const transcript = await callWithFallback(async ai => {
    const {output} = await ai.generate({prompt:[{text:'Transcribe the attached English reference sentence verbatim. Do not paraphrase, correct grammar, or add words. If the audio is unclear, return an empty transcript.'},{media:{url:uri}}],output:{schema:z.object({transcript:z.string()})},config:{temperature:0}});
    if (!output?.transcript.trim()) throw new Error('Reference audio requires transcription review.');
    return output.transcript.trim();
  },{task:'server-action'});
  await ref.set({transcript,createdAt:Date.now(),source:'mock-1-reference-audio'});
  return transcript;
}
