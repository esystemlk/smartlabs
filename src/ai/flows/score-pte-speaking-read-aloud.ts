'use server';

import { ai } from '@/ai/genkit';
import {
    PteReadAloudInputSchema,
    PteReadAloudOutputSchema,
    type PteReadAloudInput,
    type PteReadAloudOutput,
} from './pte-speaking.types';

const pteReadAloudScoringPrompt = ai.definePrompt({
  name: 'pteReadAloudScoringPrompt',
  input: { schema: PteReadAloudInputSchema },
  output: { schema: PteReadAloudOutputSchema },
  prompt: (input) => [
    {
      role: 'user',
      content: [
        {
          text: `You are an expert PTE examiner AI. Your task is to score a "Read Aloud" speaking task.

The user was given the following text to read:
---
ORIGINAL TEXT: ${input.text}
---

You have been provided with an audio recording of the user reading this text. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Compare the 'transcript' to the 'ORIGINAL TEXT'. Calculate a 'contentScore' out of 90 based on the percentage of words that were correctly read, inserted, or omitted.
3.  Evaluate the user's speech for clarity, phoneme accuracy, and stress/intonation. Provide a 'pronunciationScore' out of 90, where 90 is native-like.
4.  Evaluate the user's rhythm, pace, and phrasing. There should be no unnatural hesitations. Provide a 'fluencyScore' out of 90, where 90 is native-like.
5.  Calculate an 'overallScore' which is the average of the content, pronunciation, and fluency scores.
6.  Provide specific, constructive 'feedback' explaining the scores. Pinpoint specific words that were mispronounced or where fluency was lost.
`
        },
        {
           media: {
             url: input.audioDataUri,
             contentType: 'audio/webm'
           }
         }
      ]
    }
  ],
});

const scorePteReadAloudFlow = ai.defineFlow(
  {
    name: 'scorePteReadAloudFlow',
    inputSchema: PteReadAloudInputSchema,
    outputSchema: PteReadAloudOutputSchema,
  },
  async (input) => {
    const { output } = await pteReadAloudScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the speaking task.');
    }
    return output;
  }
);

export async function scorePteReadAloud(
  input: PteReadAloudInput
): Promise<PteReadAloudOutput> {
  console.log('--- PTE READ ALOUD AI ACTION STARTED ---');
  try {
    const result = await scorePteReadAloudFlow(input);
    console.log('AI Scoring Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('PTE Read Aloud AI Error:', error);
    // Log detailed error information for Genkit/Gemini
    if (error.response) {
      console.error('Genkit Response Error:', JSON.stringify(error.response, null, 2));
    }
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
