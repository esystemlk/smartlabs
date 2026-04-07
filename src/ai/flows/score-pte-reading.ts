'use server';

import { ai } from '@/ai/genkit';
import { PteReadingTestInputSchema, PteReadingTestOutputSchema, type PteReadingTestInput, type PteReadingTestOutput } from './pte-reading.types';


// Define the AI prompt for scoring
const pteReadingScoringPrompt = ai.definePrompt({
  name: 'pteReadingScoringPrompt',
  input: { schema: PteReadingTestInputSchema },
  output: { schema: PteReadingTestOutputSchema },
  prompt: (input) => `You are an expert PTE (Pearson Test of English) examiner. Your task is to score a multiple-choice reading test.

For each question provided in the input, you must:
1.  Compare the 'userAnswer' to the 'correctAnswer'.
2.  Set 'isCorrect' to true if they match, and false otherwise.
3.  If the answer is incorrect, provide a brief, helpful 'feedback' explaining why the correct answer is the right choice based on the question. If correct, the feedback should be a short, positive confirmation like "Correct!".
4.  After evaluating all questions, calculate the 'overallScore' as a percentage of correct answers.
5.  Provide some 'generalFeedback' in one or two sentences, encouraging the user and suggesting what to focus on next.

Here is the test data:
${JSON.stringify(input.questions, null, 2)}
`,
});

// Define the Genkit flow for scoring
const scorePteReadingFlow = ai.defineFlow(
  {
    name: 'scorePteReadingFlow',
    inputSchema: PteReadingTestInputSchema,
    outputSchema: PteReadingTestOutputSchema,
  },
  async (testData) => {
    const { output } = await pteReadingScoringPrompt(testData);
    if (!output) {
        throw new Error('AI failed to generate a score.');
    }
    return output;
  }
);

// Export a wrapper function to be used as a server action
export async function scorePteReadingTest(
  input: PteReadingTestInput
): Promise<PteReadingTestOutput> {
  console.log('--- PTE READING AI ACTION STARTED ---');
  try {
    const result = await scorePteReadingFlow(input);
    console.log('AI Scoring Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error: any) {
    console.error('PTE Reading AI Error:', error);
    throw new Error(`AI Scoring Matrix Synchronisation Failed: ${error.message || 'Unknown error'}`);
  }
}
