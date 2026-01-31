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
  prompt: `You are an expert PTE examiner AI. Your task is to score an "Answer Short Question" speaking task.

The user was asked the following question:
QUESTION: {{{questionAudioTranscript}}}

The expected simple answer is:
EXPECTED ANSWER: {{{expectedAnswer}}}

You have been provided with an audio recording of the user's answer. Your task is to:
1.  Transcribe the user's speech accurately into the 'transcript' field.
2.  Evaluate if the user's answer is correct based on the 'EXPECTED ANSWER'. The user's answer might be a single word or a short phrase. Set 'isCorrect' to true or false.
3.  Provide 'feedback' explaining why the answer is correct or incorrect, and add brief notes on pronunciation or fluency if needed.
4.  Evaluate the user's 'pronunciationScore' and 'fluencyScore' out of 90.
5.  Calculate an 'overallScore'. For this task, the content score is 90 if the answer is correct, and 10 if it's incorrect. The overall score is the average of this content score, the pronunciation score, and the fluency score.

Here is the user's audio recording:
{{media url=audioDataUri}}
`,
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
