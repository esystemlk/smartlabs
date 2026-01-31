'use server';

import { ai } from '@/ai/genkit';
import {
    PteWriteEssayInputSchema,
    PteWriteEssayOutputSchema,
    type PteWriteEssayInput,
    type PteWriteEssayOutput,
} from './pte-writing.types';

const pteWriteEssayScoringPrompt = ai.definePrompt({
  name: 'pteWriteEssayScoringPrompt',
  input: { schema: PteWriteEssayInputSchema },
  output: { schema: PteWriteEssayOutputSchema },
  prompt: `You are an expert PTE examiner AI. Your task is to score a "Write Essay" task.

The user was given the following topic:
---
TOPIC: {{{topic}}}
---

The user wrote the following essay (200-300 words):
---
ESSAY: {{{essay}}}
---

Please evaluate the essay based on the following criteria:
1.  **Content (0-3 points)**: Does the essay address all aspects of the topic with relevant ideas and examples?
2.  **Form (0-2 points)**: Is the word count between 200 and 300 words? (2 for in range, 1 for close, 0 for far off).
3.  **Development, Structure and Coherence (0-2 points)**: Is the essay well-organized with a clear introduction, body paragraphs, and conclusion?
4.  **Grammar (0-2 points)**: Is the grammar correct and varied?
5.  **Vocabulary (0-2 points)**: Is the vocabulary range good and used appropriately?
6.  **Spelling (0-2 points)**: Is the spelling correct?

Calculate the scores for each criterion and sum them for the 'overallScore'. Provide specific, constructive 'feedback' explaining the scores for each category and giving overall suggestions for improvement.`,
});

const scorePteWriteEssayFlow = ai.defineFlow(
  {
    name: 'scorePteWriteEssayFlow',
    inputSchema: PteWriteEssayInputSchema,
    outputSchema: PteWriteEssayOutputSchema,
  },
  async (input) => {
    const { output } = await pteWriteEssayScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the essay.');
    }
    return output;
  }
);

export async function scorePteWriteEssay(
  input: PteWriteEssayInput
): Promise<PteWriteEssayOutput> {
  return await scorePteWriteEssayFlow(input);
}
