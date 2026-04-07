'use server';

import { ai } from '@/ai/genkit';
import {
    PteDescribeImageInputSchema,
    PteDescribeImageOutputSchema,
    type PteDescribeImageInput,
    type PteDescribeImageOutput,
} from './pte-speaking.types';

const pteDescribeImageScoringPrompt = ai.definePrompt({
  name: 'pteDescribeImageScoringPrompt',
  input: { schema: PteDescribeImageInputSchema },
  output: { schema: PteDescribeImageOutputSchema },
  prompt: (input) => [
    {
      role: 'user',
      content: [
        {
          text: `You are an expert PTE examiner AI. Your task is to score a "Describe Image" speaking task.

The user was asked to describe the image at this URL: ${input.imageUrl}.

You have been provided with an audio recording of the user describing the image. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Evaluate the transcript to determine how well the user described the main features and details of the image. Calculate a 'contentScore' out of 90.
3.  Evaluate the user's pronunciation for clarity and native-like quality. Provide a 'pronunciationScore' out of 90.
4.  Evaluate the user's fluency, rhythm, and pace. Provide a 'fluencyScore' out of 90.
5.  Calculate an 'overallScore' which is the average of the content, pronunciation, and fluency scores.
6.  Provide specific, constructive 'feedback' on their description, pronunciation, and fluency.
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

const scorePteDescribeImageFlow = ai.defineFlow(
  {
    name: 'scorePteDescribeImageFlow',
    inputSchema: PteDescribeImageInputSchema,
    outputSchema: PteDescribeImageOutputSchema,
  },
  async (input) => {
    const { output } = await pteDescribeImageScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the speaking task.');
    }
    return output;
  }
);

export async function scorePteDescribeImage(
  input: PteDescribeImageInput
): Promise<PteDescribeImageOutput> {
  return await scorePteDescribeImageFlow(input);
}
