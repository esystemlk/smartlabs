'use server';

import { getAi } from '@/ai/genkit';
import {
    PteWriteFromDictationInputSchema,
    PteWriteFromDictationOutputSchema,
    type PteWriteFromDictationInput,
    type PteWriteFromDictationOutput,
} from './pte-listening.types';

export const scorePteWriteFromDictationFlow = async (input: PteWriteFromDictationInput) => {
  const ai = getAi();
  const pteWriteFromDictationScoringPrompt = ai.definePrompt({
    name: 'pteWriteFromDictationScoringPrompt',
    input: { schema: PteWriteFromDictationInputSchema },
    output: { schema: PteWriteFromDictationOutputSchema },
    prompt: (input: any) => `You are an expert PTE examiner AI. Your task is to score a "Write from Dictation" task.

The user heard the following sentence:
---
ORIGINAL: ${input.originalSentence}
---

The user wrote:
---
WRITTEN: ${input.writtenSentence}
---

Please evaluate the user's written sentence.
1.  Count the number of correct words written in the correct sequence.
2.  The score is calculated based on the number of correct words. Each correct word gets 1 point, up to the total number of words in the original sentence. Then normalize this to a score out of 90.
3.  Set 'correctWords' and 'totalWords'.
4.  Provide 'feedback' that clearly points out any spelling mistakes, extra words, or missed words.
`,
  });

  const { output } = await pteWriteFromDictationScoringPrompt(input);
  if (!output) {
    throw new Error('AI failed to generate a score.');
  }
  return output;
};

export async function scorePteWriteFromDictation(
  input: PteWriteFromDictationInput
): Promise<PteWriteFromDictationOutput> {
  console.log('--- PTE WRITE FROM DICTATION AI ACTION STARTED ---');
  try {
    const result = await scorePteWriteFromDictationFlow(input);
    console.log('AI Scoring Result Success');
    return result;
  } catch (error: any) {
    console.error('PTE Write From Dictation AI Error:', error);
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
