'use server';

import { ai } from '@/ai/genkit';
import {
    PteAnswerShortQuestionInputSchema,
    PteAnswerShortQuestionOutputSchema,
    type PteAnswerShortQuestionInput,
    type PteAnswerShortQuestionOutput,
} from './pte-speaking.types';

const pteAnswerShortQuestionScoringPrompt = ai.definePrompt({
  name: 'pteAnswerShortQuestionScoringPrompt',
  input: { schema: PteAnswerShortQuestionInputSchema },
  output: { schema: PteAnswerShortQuestionOutputSchema },
  prompt: (input) => [
    {
      role: 'user',
      content: [
        {
          text: `You are an expert PTE examiner AI. Your task is to score an "Answer Short Question" speaking task.

The user was asked the following question:
---
QUESTION TRANSCRIPT: ${input.questionAudioTranscript}
---
The expected answer is: ${input.expectedAnswer}

You have been provided with an audio recording of the user's response. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Check if the 'transcript' contains the 'expectedAnswer'. Set 'isCorrect' to true if it does, false otherwise.
3.  Evaluate the user's pronunciation and fluency. Provide a 'pronunciationScore' and a 'fluencyScore' out of 90.
4.  Provide brief 'feedback' on the correctness of the answer and on the user's speech quality.
5.  Calculate an 'overallScore'. For this task, the content score is 90 if the answer is correct, and 10 if it's incorrect. The overall score is the average of this content score, the pronunciation score, and the fluency score.
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

const scorePteAnswerShortQuestionFlow = ai.defineFlow(
  {
    name: 'scorePteAnswerShortQuestionFlow',
    inputSchema: PteAnswerShortQuestionInputSchema,
    outputSchema: PteAnswerShortQuestionOutputSchema,
  },
  async (input) => {
    const { output } = await pteAnswerShortQuestionScoringPrompt(input);
    if (!output) {
      throw new Error('AI failed to generate a score for the speaking task.');
    }
    return output;
  }
);

export async function scorePteAnswerShortQuestion(
  input: PteAnswerShortQuestionInput
): Promise<PteAnswerShortQuestionOutput> {
  return await scorePteAnswerShortQuestionFlow(input);
}
