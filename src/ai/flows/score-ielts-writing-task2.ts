'use server';

import { getAi } from '@/ai/genkit';
import {
  IeltsWritingTask2InputSchema,
  IeltsWritingTask2OutputSchema,
  type IeltsWritingTask2Input,
  type IeltsWritingTask2Output,
} from './ielts-writing.types';

export const scoreIeltsWritingTask2Flow = async (input: IeltsWritingTask2Input) => {
  const ai = getAi();
  const ieltsScoringPrompt = ai.definePrompt({
    name: 'ieltsWritingTask2ScoringPrompt',
    input: { schema: IeltsWritingTask2InputSchema },
    output: { schema: IeltsWritingTask2OutputSchema },
    prompt: (input: any) => `You are an expert IELTS examiner. Your task is to score a Writing Task 2 essay based on the official IELTS band descriptors.

The user has submitted an essay on the following topic:
TOPIC: ${input.topic}

Here is the user's essay:
---
${input.essay}
---

Please evaluate the essay based on the four IELTS assessment criteria:
1.  **Task Response**: How well the writer addresses all parts of the task.
2.  **Coherence and Cohesion**: How well the ideas are organized, linked, and paragraphed.
3.  **Lexical Resource**: The range and accuracy of the vocabulary used.
4.  **Grammatical Range and Accuracy**: The range and accuracy of the grammar used.

For each of the four criteria, provide a band score from 0 to 9 and specific, constructive feedback explaining the score.

After evaluating each criterion, calculate the 'overallBandScore'. This should be the average of the four criteria scores, rounded to the nearest half-band (e.g., 6.25 becomes 6.5, 6.75 becomes 7.0, 6.1 becomes 6.0).

Finally, provide a 'generalFeedback' paragraph summarizing the essay's main strengths and the most important areas for improvement.
`,
  });

  const { output } = await ieltsScoringPrompt(input);
  if (!output) {
    throw new Error('AI failed to generate a score for the essay.');
  }
  return output;
};

export async function scoreIeltsWritingTask2(
  input: IeltsWritingTask2Input
): Promise<IeltsWritingTask2Output> {
  console.log('--- IELTS WRITING TASK 2 AI ACTION STARTED ---');
  try {
    const result = await scoreIeltsWritingTask2Flow(input);
    console.log('AI Scoring Result Success');
    return result;
  } catch (error: any) {
    console.error('IELTS Writing Task 2 AI Error:', error);
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
