'use server';

import { getAi } from '@/ai/genkit';
import {
    PteSummarizeWrittenTextInputSchema,
    PteSummarizeWrittenTextOutputSchema,
    type PteSummarizeWrittenTextInput,
    type PteSummarizeWrittenTextOutput,
} from './pte-writing.types';

export const scorePteSummarizeWrittenTextFlow = async (input: PteSummarizeWrittenTextInput) => {
  const ai = getAi();
  const pteSummarizeWrittenTextScoringPrompt = ai.definePrompt({
    name: 'pteSummarizeWrittenTextScoringPrompt',
    input: { schema: PteSummarizeWrittenTextInputSchema },
    output: { schema: PteSummarizeWrittenTextOutputSchema },
    prompt: (input: any) => `You are an expert PTE examiner AI. Your task is to score a "Summarize Written Text" task.

The user was given the following passage:
---
PASSAGE: ${input.passage}
---

The user wrote the following one-sentence summary:
---
SUMMARY: ${input.summary}
---

Please evaluate the summary based on the following criteria:
1.  **Content (0-2 points)**: Does the summary accurately represent the main ideas of the passage? (2 points for all main points, 1 for some, 0 for none).
2.  **Form (0-1 points)**: Is the summary a single, complete sentence? Is it between 5 and 75 words long? (1 point if yes, 0 if no).
3.  **Grammar (0-2 points)**: Is the grammar correct? (2 for no errors, 1 for minor errors, 0 for significant errors).
4.  **Vocabulary (0-2 points)**: Is the vocabulary appropriate and effective? (2 for good usage, 1 for some errors, 0 for poor usage).

Calculate the scores for each criterion and sum them for the 'overallScore'. Provide specific, constructive 'feedback' explaining the scores for each category.
`,
  });

  const { output } = await pteSummarizeWrittenTextScoringPrompt(input);
  if (!output) {
    throw new Error('AI failed to generate a score for the summary.');
  }
  return output;
};

export async function scorePteSummarizeWrittenText(
  input: PteSummarizeWrittenTextInput
): Promise<PteSummarizeWrittenTextOutput> {
  console.log('--- PTE SUMMARIZE WRITTEN TEXT AI ACTION STARTED ---');
  try {
    const result = await scorePteSummarizeWrittenTextFlow(input);
    console.log('AI Scoring Result Success');
    return result;
  } catch (error: any) {
    console.error('PTE Summarize Written Text AI Error:', error);
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
