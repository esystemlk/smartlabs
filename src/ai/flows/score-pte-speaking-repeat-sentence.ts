'use server';

import { ai } from '@/ai/genkit';
import {
    PteRepeatSentenceInputSchema,
    PteRepeatSentenceOutputSchema,
    type PteRepeatSentenceInput,
    type PteRepeatSentenceOutput,
} from './pte-speaking.types';

const pteRepeatSentenceScoringPrompt = ai.definePrompt({
  name: 'pteRepeatSentenceScoringPrompt',
  input: { schema: PteRepeatSentenceInputSchema },
  output: { schema: PteRepeatSentenceOutputSchema },
  prompt: (input) => [
    {
      role: 'user',
      content: [
        {
          text: `You are an expert PTE examiner AI. Your task is to score a "Repeat Sentence" speaking task.

The user was asked to repeat the following sentence:
---
ORIGINAL SENTENCE: ${input.originalSentence}
---

You have been provided with an audio recording of the user repeating this sentence. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Compare the 'transcript' to the 'ORIGINAL SENTENCE'. Calculate a 'contentScore' out of 90 based on the percentage of words that were correctly repeated.
3.  Evaluate the user's speech for clarity and phoneme accuracy. Provide a 'pronunciationScore' out of 90.
4.  Evaluate the user's rhythm and pace. There should be no unnatural hesitations. Provide a 'fluencyScore' out of 90.
5.  Calculate an 'overallScore' which is the average of the content, pronunciation, and fluency scores.
6.  Provide specific, constructive 'feedback' explaining the scores. Pinpoint specific words that were mispronounced or where fluency was lost.
`
        },
        {
          media: {
            url: input.audioDataUri
          }
        }
      ]
    }
  ],
});

const scorePteRepeatSentenceFlow = ai.defineFlow(
  {
    name: 'scorePteRepeatSentenceFlow',
    inputSchema: PteRepeatSentenceInputSchema,
    outputSchema: PteRepeatSentenceOutputSchema,
  },
  async (input) => {
    const { output } = await pteRepeatSentenceScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the speaking task.');
    }
    return output;
  }
);

export async function scorePteRepeatSentence(
  input: PteRepeatSentenceInput
): Promise<PteRepeatSentenceOutput> {
  return await scorePteRepeatSentenceFlow(input);
}
