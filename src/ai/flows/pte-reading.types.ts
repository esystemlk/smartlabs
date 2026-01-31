import { z } from 'zod';

// Define the schema for a single question with user's answer
export const ScoredQuestionSchema = z.object({
  id: z.string(),
  questionText: z.string(),
  userAnswer: z.string(),
  correctAnswer: z.string(),
  isCorrect: z.boolean(),
  feedback: z.string().describe('Provide brief, constructive feedback for incorrect answers, explaining why the correct answer is right.'),
});

// Define the schema for the test scoring input
export const PteReadingTestInputSchema = z.object({
  questions: z.array(z.object({
      id: z.string(),
      questionText: z.string(),
      userAnswer: z.string(),
      correctAnswer: z.string(),
  })),
});
export type PteReadingTestInput = z.infer<typeof PteReadingTestInputSchema>;


// Define the schema for the test scoring output
export const PteReadingTestOutputSchema = z.object({
  overallScore: z.number().describe('The overall score as a percentage (0-100).'),
  generalFeedback: z.string().describe('Provide one or two sentences of overall feedback based on performance.'),
  results: z.array(ScoredQuestionSchema),
});
export type PteReadingTestOutput = z.infer<typeof PteReadingTestOutputSchema>;
