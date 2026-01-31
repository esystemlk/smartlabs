import { z } from 'zod';

// Schema for the input to the IELTS Writing Task 2 scoring flow
export const IeltsWritingTask2InputSchema = z.object({
  topic: z.string().describe('The essay topic or question.'),
  essay: z.string().min(100, 'Essay must be at least 100 words.').describe('The user\'s full essay text.'),
});
export type IeltsWritingTask2Input = z.infer<typeof IeltsWritingTask2InputSchema>;

// Schema for the detailed feedback criteria
const CriteriaScoreSchema = z.object({
  score: z.number().min(0).max(9).describe('The band score for this criterion (0-9).'),
  feedback: z.string().describe('Specific feedback for this criterion.'),
});

// Schema for the output of the IELTS Writing Task 2 scoring flow
export const IeltsWritingTask2OutputSchema = z.object({
  overallBandScore: z.number().min(0).max(9).describe('The overall estimated band score for the essay.'),
  feedback: z.object({
    taskResponse: CriteriaScoreSchema,
    coherenceAndCohesion: CriteriaScoreSchema,
    lexicalResource: CriteriaScoreSchema,
    grammaticalRangeAndAccuracy: CriteriaScoreSchema,
  }),
  generalFeedback: z.string().describe('Overall summary of strengths and areas for improvement.'),
});
export type IeltsWritingTask2Output = z.infer<typeof IeltsWritingTask2OutputSchema>;
