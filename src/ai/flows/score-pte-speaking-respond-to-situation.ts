'use server';

import { ai } from '@/ai/genkit';
import {
    PteRespondToSituationInputSchema,
    PteRespondToSituationOutputSchema,
    type PteRespondToSituationInput,
    type PteRespondToSituationOutput,
} from './pte-speaking.types';

const pteRespondToSituationScoringPrompt = ai.definePrompt({
  name: 'pteRespondToSituationScoringPrompt',
  input: { schema: PteRespondToSituationInputSchema },
  output: { schema: PteRespondToSituationOutputSchema },
  prompt: `You are an expert PTE examiner AI. Your task is to score a "Respond to a Situation" speaking task.

The user was presented with the following situation:
---
SITUATION: {{{situationTranscript}}}
---

You have been provided with an audio recording of the user's response. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Evaluate the transcript to determine how appropriately and completely the user responded to the situation. Calculate a 'contentScore' out of 90.
3.  Evaluate the user's pronunciation for clarity and native-like quality. Provide a 'pronunciationScore' out of 90.
4.  Evaluate the user's fluency, rhythm, and pace. Speech should be smooth with minimal hesitation. Provide a 'fluencyScore' out of 90.
5.  Calculate an 'overallScore' which is the average of the content, pronunciation, and fluency scores.
6.  Provide specific, constructive 'feedback' on the content of the response, as well as on pronunciation and fluency.

Here is the user's audio recording:
{{media url=audioDataUri}}
`,
});

const scorePteRespondToSituationFlow = ai.defineFlow(
  {
    name: 'scorePteRespondToSituationFlow',
    inputSchema: PteRespondToSituationInputSchema,
    outputSchema: PteRespondToSituationOutputSchema,
  },
  async (input) => {
    const { output } = await pteRespondToSituationScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the speaking task.');
    }
    return output;
  }
);

export async function scorePteRespondToSituation(
  input: PteRespondToSituationInput
): Promise<PteRespondToSituationOutput> {
  return await scorePteRespondToSituationFlow(input);
}
