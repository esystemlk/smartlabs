'use server';

import { ai } from '@/ai/genkit';
import {
    PteSummarizeSpokenTextInputSchema,
    PteSummarizeSpokenTextOutputSchema,
    type PteSummarizeSpokenTextInput,
    type PteSummarizeSpokenTextOutput,
} from './pte-listening.types';

const pteSummarizeSpokenTextScoringPrompt = ai.definePrompt({
  name: 'pteSummarizeSpokenTextScoringPrompt',
  input: { schema: PteSummarizeSpokenTextInputSchema },
  output: { schema: PteSummarizeSpokenTextOutputSchema },
  prompt: `You are an expert PTE examiner AI. Your task is to score a "Summarize Spoken Text" task.

The user listened to an audio with the following transcript:
---
TRANSCRIPT: {{{lectureTranscript}}}
---

The user wrote the following summary (50-70 words):
---
SUMMARY: {{{summary}}}
---

Please evaluate the summary based on the following criteria, each out of 2 points:
1.  **Content**: How well does the summary capture the main points and conclusion? (2 for all main points, 1 for some, 0 for poor representation).
2.  **Form**: Is the word count between 50 and 70? (2 points for being within range, 0 otherwise).
3.  **Grammar**: Is the grammar correct? (2 for no errors, 1 for minor errors, 0 for significant errors).
4.  **Vocabulary**: Is the vocabulary appropriate and varied? (2 for good usage, 1 for some errors, 0 for poor usage).
5.  **Spelling**: Is the spelling correct? (2 for no errors, 1 for minor errors, 0 for significant errors).

Calculate the scores for each criterion and sum them for the 'overallScore' (out of 10). Provide specific, constructive 'feedback' explaining the scores for each category.
`,
});

const scorePteSummarizeSpokenTextFlow = ai.defineFlow(
  {
    name: 'scorePteSummarizeSpokenTextFlow',
    inputSchema: PteSummarizeSpokenTextInputSchema,
    outputSchema: PteSummarizeSpokenTextOutputSchema,
  },
  async (input) => {
    const { output } = await pteSummarizeSpokenTextScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the summary.');
    }
    return output;
  }
);

export async function scorePteSummarizeSpokenText(
  input: PteSummarizeSpokenTextInput
): Promise<PteSummarizeSpokenTextOutput> {
  return await scorePteSummarizeSpokenTextFlow(input);
}
