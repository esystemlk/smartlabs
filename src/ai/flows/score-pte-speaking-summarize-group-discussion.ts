'use server';

import { getAi } from '@/ai/genkit';
import {
    PteSummarizeGroupDiscussionInputSchema,
    PteSummarizeGroupDiscussionOutputSchema,
    type PteSummarizeGroupDiscussionInput,
    type PteSummarizeGroupDiscussionOutput,
} from './pte-speaking.types';

export const scorePteSummarizeGroupDiscussionFlow = async (input: PteSummarizeGroupDiscussionInput) => {
  const ai = getAi();
  const pteSummarizeGroupDiscussionScoringPrompt = ai.definePrompt({
    name: 'pteSummarizeGroupDiscussionScoringPrompt',
    input: { schema: PteSummarizeGroupDiscussionInputSchema },
    output: { schema: PteSummarizeGroupDiscussionOutputSchema },
    prompt: (input: any) => [
      {
        role: 'user',
        content: [
          {
            text: `You are an expert PTE examiner AI. Your task is to score a "Summarize Group Discussion" speaking task.

The user listened to a group discussion with the following content:
---
DISCUSSION TRANSCRIPT: ${input.discussionTranscript}
---

You have been provided with an audio recording of the user summarizing the discussion. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Evaluate the transcript to determine how well the user summarized the main points and conclusion of the discussion. Calculate a 'contentScore' out of 90.
3.  Evaluate the user's pronunciation for clarity and native-like quality. Provide a 'pronunciationScore' out of 90.
4.  Evaluate the user's fluency, rhythm, and pace. Provide a 'fluencyScore' out of 90.
5.  Calculate an 'overallScore' which is the average of the content, pronunciation, and fluency scores.
6.  Provide specific, constructive 'feedback' on how well they covered the discussion content, and on their pronunciation and fluency.
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

  const { output } = await pteSummarizeGroupDiscussionScoringPrompt(input);
  if (!output) {
    throw new Error('AI failed to generate a score for the speaking task.');
  }
  return output;
};

export async function scorePteSummarizeGroupDiscussion(
  input: PteSummarizeGroupDiscussionInput
): Promise<PteSummarizeGroupDiscussionOutput> {
  console.log('--- PTE SUMMARIZE GROUP DISCUSSION AI ACTION STARTED ---');
  try {
    const result = await scorePteSummarizeGroupDiscussionFlow(input);
    console.log('AI Scoring Result Success');
    return result;
  } catch (error: any) {
    console.error('PTE Summarize Group Discussion AI Error:', error);
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
