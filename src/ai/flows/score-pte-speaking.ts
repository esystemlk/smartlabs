'use server';

import { z } from 'genkit';
import { callWithFallback } from '@/ai/genkit';

/**
 * AI scoring for PTE Academic SPEAKING tasks. The student's recorded audio is
 * sent to Gemini (multimodal) which transcribes it and scores the three
 * Pearson "enabling skills" — Content, Oral Fluency, Pronunciation — each on
 * the 0–90 scale, plus an overall 10–90. Works for all mic-based tasks; the
 * rubric text is tailored per task type.
 */

const SpeakingScoreSchema = z.object({
  transcript: z.string().describe("A faithful transcript of exactly what the student said."),
  content: z.number().min(0).max(90).describe("Content score 0-90: relevance & completeness vs the prompt."),
  fluency: z.number().min(0).max(90).describe("Oral fluency 0-90: rhythm, phrasing, natural pace, few hesitations/repetitions."),
  pronunciation: z.number().min(0).max(90).describe("Pronunciation 0-90: clarity, vowels/consonants, stress & intonation (best-effort from audio)."),
  overall: z.number().min(10).max(90).describe("Overall speaking score 10-90."),
  contentFeedback: z.string().describe("1-2 sentences on content."),
  fluencyFeedback: z.string().describe("1-2 sentences on fluency."),
  pronunciationFeedback: z.string().describe("1-2 sentences on pronunciation."),
  tips: z.array(z.string()).max(3).describe("Up to 3 concrete improvement tips."),
});
export type SpeakingScore = z.infer<typeof SpeakingScoreSchema>;

export interface SpeakingScoreInput {
  taskType: string;
  /** The reference text (Read Aloud/Repeat Sentence), the question, image caption, or lecture gist. */
  promptText: string;
  /** data:audio/...;base64,... of the student's recording. */
  audioDataUri: string;
}

const RUBRICS: Record<string, string> = {
  'read-aloud':
    'READ ALOUD: the student reads the reference text aloud. Content = how completely and accurately they read the given words (omissions/insertions lower it). Fluency = smooth, even pace without hesitation. Pronunciation = clear, correct sounds and stress.',
  'repeat-sentence':
    'REPEAT SENTENCE: the student repeats a sentence they heard. Content = how many words match the reference sentence in the correct order. Fluency = repeated in one smooth flow. Pronunciation = clear.',
  'describe-image':
    'DESCRIBE IMAGE: the student describes an image (the prompt text is what the image shows). Content = covers the key elements/trends and draws a conclusion. Fluency = continuous 40s description. Pronunciation = clear.',
  'retell-lecture':
    'RETELL LECTURE: the student re-tells a lecture (the prompt text is the lecture gist). Content = captures the main points and relationships. Fluency = coherent retell. Pronunciation = clear.',
  'answer-short-question':
    'ANSWER SHORT QUESTION: the student answers a simple question in one or a few words (prompt text = the question; the ideal answer is a common word). Content = is the answer correct? (this dominates). Fluency & pronunciation = minor.',
};

export async function scorePteSpeaking(input: SpeakingScoreInput): Promise<SpeakingScore> {
  const rubric = RUBRICS[input.taskType] ?? 'General PTE Academic speaking rubric: score content, fluency and pronunciation.';

  return callWithFallback(async (ai) => {
    const { output } = await ai.generate({
      prompt: [
        {
          text:
`You are a strict but fair PTE Academic speaking examiner. Score the attached audio recording using the official Pearson enabling skills.

TASK TYPE: ${input.taskType}
${rubric}

PROMPT / REFERENCE:
"""
${input.promptText}
"""

Steps:
1. Transcribe the audio exactly (including filler words and mistakes).
2. Score Content, Oral Fluency and Pronunciation each on the 0–90 Pearson scale.
3. Give an overall score 10–90 (roughly the weighted blend for this task type).
4. Write concise, specific feedback for each skill and up to 3 actionable tips.
Be realistic: silence or off-topic answers score very low; near-perfect delivery scores 80+.`,
        },
        { media: { url: input.audioDataUri } },
      ],
      output: { schema: SpeakingScoreSchema },
      config: { temperature: 0.2 },
    });
    if (!output) throw new Error('AI failed to score the recording.');
    return output;
  }, { task: 'server-action' });
}
