import { z } from 'zod';

// --- Summarize Spoken Text ---
export const PteSummarizeSpokenTextInputSchema = z.object({
  lectureTranscript: z.string().describe('The transcript of the audio the user listened to.'),
  summary: z.string().max(70, 'Summary must be between 50 and 70 words.').min(50, 'Summary must be between 50 and 70 words.').describe('The user\'s written summary of the audio.'),
});
export type PteSummarizeSpokenTextInput = z.infer<typeof PteSummarizeSpokenTextInputSchema>;

export const PteSummarizeSpokenTextOutputSchema = z.object({
    contentScore: z.number().min(0).max(2).describe("Score for covering the main points."),
    formScore: z.number().min(0).max(2).describe("Score for word count (50-70 words)."),
    grammarScore: z.number().min(0).max(2).describe("Score for grammatical accuracy."),
    vocabularyScore: z.number().min(0).max(2).describe("Score for appropriate and varied vocabulary."),
    spellingScore: z.number().min(0).max(2).describe("Score for spelling accuracy."),
    overallScore: z.number().min(0).max(10).describe("The total score for the task."),
    feedback: z.string().describe("Specific feedback on each scoring criterion."),
});
export type PteSummarizeSpokenTextOutput = z.infer<typeof PteSummarizeSpokenTextOutputSchema>;

// --- Write from Dictation ---
export const PteWriteFromDictationInputSchema = z.object({
  originalSentence: z.string().describe('The original sentence that was dictated.'),
  writtenSentence: z.string().describe('The sentence the user typed.'),
});
export type PteWriteFromDictationInput = z.infer<typeof PteWriteFromDictationInputSchema>;

export const PteWriteFromDictationOutputSchema = z.object({
    score: z.number().min(0).max(90).describe("Score based on the number of correct words in the correct sequence."),
    correctWords: z.number().describe("The number of correctly typed words."),
    totalWords: z.number().describe("The total number of words in the original sentence."),
    feedback: z.string().describe("Feedback highlighting any errors in spelling or missed words."),
});
export type PteWriteFromDictationOutput = z.infer<typeof PteWriteFromDictationOutputSchema>;
