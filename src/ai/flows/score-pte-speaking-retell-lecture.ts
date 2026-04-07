'use server';

import { ai } from '@/ai/genkit';
import {
    PteRetellLectureInputSchema,
    PteRetellLectureOutputSchema,
    type PteRetellLectureInput,
    type PteRetellLectureOutput,
} from './pte-speaking.types';

const pteRetellLectureScoringPrompt = ai.definePrompt({
  name: 'pteRetellLectureScoringPrompt',
  input: { schema: PteRetellLectureInputSchema },
  output: { schema: PteRetellLectureOutputSchema },
  prompt: (input) => [
    {
      role: 'user',
      content: [
        {
          text: `You are an expert PTE examiner AI. Your task is to score a "Retell Lecture" speaking task.

The user listened to a lecture with the following content:
---
LECTURE TRANSCRIPT: ${input.lectureTranscript}
---

You have been provided with an audio recording of the user retelling the main points of the lecture. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Evaluate the transcript to determine how well the user retold the main points and conclusion of the lecture. The retelling should be accurate and include key information. Calculate a 'contentScore' out of 90.
3.  Evaluate the user's pronunciation for clarity and native-like quality. Provide a 'pronunciationScore' out of 90.
4.  Evaluate the user's fluency, rhythm, and pace. Provide a 'fluencyScore' out of 90.
5.  Calculate an 'overallScore' which is the average of the content, pronunciation, and fluency scores.
6.  Provide specific, constructive 'feedback' on how well they covered the lecture content, and on their pronunciation and fluency.
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

const scorePteRetellLectureFlow = ai.defineFlow(
  {
    name: 'scorePteRetellLectureFlow',
    inputSchema: PteRetellLectureInputSchema,
    outputSchema: PteRetellLectureOutputSchema,
  },
  async (input) => {
    const { output } = await pteRetellLectureScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the speaking task.');
    }
    return output;
  }
);

export async function scorePteRetellLecture(
  input: PteRetellLectureInput
): Promise<PteRetellLectureOutput> {
  console.log('--- PTE RETELL LECTURE AI ACTION STARTED ---');
  try {
    const result = await scorePteRetellLectureFlow(input);
    console.log('AI Scoring Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('PTE Retell Lecture AI Error:', error);
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
