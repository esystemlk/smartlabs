import { z } from 'zod';

// --- Summarize Written Text ---
export const PteSummarizeWrittenTextInputSchema = z.object({
  passage: z.string().describe('The original text passage that the user was asked to summarize.'),
  summary: z.string().max(75, 'Summary must be between 5 and 75 words.').min(5, 'Summary must be between 5 and 75 words.').describe('The user\'s one-sentence summary.'),
});
export type PteSummarizeWrittenTextInput = z.infer<typeof PteSummarizeWrittenTextInputSchema>;

export const PteSummarizeWrittenTextOutputSchema = z.object({
    contentScore: z.number().min(0).max(2).describe("Score for summarizing the main points of the passage."),
    formScore: z.number().min(0).max(1).describe("Score for the form (a single sentence, between 5 and 75 words)."),
    grammarScore: z.number().min(0).max(2).describe("Score for correct grammatical structures."),
    vocabularyScore: z.number().min(0).max(2).describe("Score for appropriate choice of words."),
    overallScore: z.number().min(0).max(7).describe("The total score for the task."),
    feedback: z.string().describe("Specific, constructive feedback on content, form, grammar, and vocabulary."),
});
export type PteSummarizeWrittenTextOutput = z.infer<typeof PteSummarizeWrittenTextOutputSchema>;

// --- Write Essay (200-300 words) ---
export const PteWriteEssayInputSchema = z.object({
  topic: z.string().describe('The essay topic or question.'),
  essay: z.string().min(150, 'Essay should be 200-300 words.').max(350, 'Essay should be 200-300 words.').describe('The user\'s full essay text.'),
});
export type PteWriteEssayInput = z.infer<typeof PteWriteEssayInputSchema>;

export const PteWriteEssayOutputSchema = z.object({
    contentScore: z.number().min(0).max(3).describe("Content: How well the topic is addressed."),
    formScore: z.number().min(0).max(2).describe("Form: Word count between 200 and 300."),
    structureScore: z.number().min(0).max(2).describe("Development, Structure and Coherence: Overall essay structure and flow."),
    grammarScore: z.number().min(0).max(2).describe("Grammar: Grammatical accuracy."),
    vocabularyScore: z.number().min(0).max(2).describe("Vocabulary: Range and appropriateness of vocabulary."),
    spellingScore: z.number().min(0).max(2).describe("Spelling: Accuracy of spelling."),
    overallScore: z.number().min(0).max(13).describe("The total score for the task."),
    feedback: z.string().describe("Specific, constructive feedback on each scoring criterion and overall improvement points."),
});
export type PteWriteEssayOutput = z.infer<typeof PteWriteEssayOutputSchema>;
