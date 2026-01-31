import { z } from 'zod';

// Schema for the input to the PTE Read Aloud scoring flow
export const PteReadAloudInputSchema = z.object({
  text: z.string().describe('The original text passage that the user was asked to read.'),
  audioDataUri: z.string().describe("A recording of the user reading the text, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
});
export type PteReadAloudInput = z.infer<typeof PteReadAloudInputSchema>;

// Schema for the output of the PTE Read Aloud scoring flow
export const PteReadAloudOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    contentScore: z.number().min(0).max(90).describe("Score based on the number of correct words compared to the original text."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on the clarity and correctness of pronunciation, rated on a native-like scale."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on the smoothness, rhythm, and pace of speech."),
    feedback: z.string().describe("Specific, constructive feedback on errors in content, pronunciation, or fluency. Mention specific words that were mispronounced."),
    overallScore: z.number().min(0).max(90).describe("The overall weighted score for the Read Aloud task."),
});
export type PteReadAloudOutput = z.infer<typeof PteReadAloudOutputSchema>;

// --- Repeat Sentence ---
export const PteRepeatSentenceInputSchema = z.object({
  originalSentence: z.string().describe('The original sentence that the user was asked to repeat.'),
  audioDataUri: z.string().describe("A recording of the user repeating the sentence, as a data URI."),
});
export type PteRepeatSentenceInput = z.infer<typeof PteRepeatSentenceInputSchema>;

export const PteRepeatSentenceOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    contentScore: z.number().min(0).max(90).describe("Score based on the number of correct words compared to the original sentence."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on pronunciation clarity."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on speech fluency and rhythm."),
    feedback: z.string().describe("Specific feedback on errors."),
    overallScore: z.number().min(0).max(90).describe("The overall weighted score."),
});
export type PteRepeatSentenceOutput = z.infer<typeof PteRepeatSentenceOutputSchema>;


// --- Describe Image ---
export const PteDescribeImageInputSchema = z.object({
  imageUrl: z.string().url().describe('The URL of the image the user needs to describe.'),
  audioDataUri: z.string().describe("A recording of the user describing the image, as a data URI."),
});
export type PteDescribeImageInput = z.infer<typeof PteDescribeImageInputSchema>;

export const PteDescribeImageOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    contentScore: z.number().min(0).max(90).describe("Score based on the relevance and completeness of the image description, including key elements, relationships, and implications."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on pronunciation clarity."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on speech fluency."),
    feedback: z.string().describe("Specific feedback on content, pronunciation, and fluency."),
    overallScore: z.number().min(0).max(90).describe("The overall weighted score."),
});
export type PteDescribeImageOutput = z.infer<typeof PteDescribeImageOutputSchema>;

// --- Retell Lecture ---
export const PteRetellLectureInputSchema = z.object({
  lectureTranscript: z.string().describe('The transcript of the lecture the user listened to.'),
  audioDataUri: z.string().describe("A recording of the user retelling the lecture, as a data URI."),
});
export type PteRetellLectureInput = z.infer<typeof PteRetellLectureInputSchema>;

export const PteRetellLectureOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    contentScore: z.number().min(0).max(90).describe("Score based on how well the user retold the main points of the lecture."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on pronunciation clarity."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on speech fluency."),
    feedback: z.string().describe("Specific feedback on content, pronunciation, and fluency."),
    overallScore: z.number().min(0).max(90).describe("The overall weighted score."),
});
export type PteRetellLectureOutput = z.infer<typeof PteRetellLectureOutputSchema>;

// --- Answer Short Question ---
export const PteAnswerShortQuestionInputSchema = z.object({
  questionAudioTranscript: z.string().describe('The transcript of the question that was read to the user.'),
  expectedAnswer: z.string().describe('A simple, correct answer to the question.'),
  audioDataUri: z.string().describe("A recording of the user answering the question, as a data URI."),
});
export type PteAnswerShortQuestionInput = z.infer<typeof PteAnswerShortQuestionInputSchema>;

export const PteAnswerShortQuestionOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    isCorrect: z.boolean().describe("Whether the user's answer was correct. The answer should be a simple word or phrase."),
    feedback: z.string().describe("Feedback on why the answer was correct or incorrect, and brief notes on pronunciation/fluency if there are issues."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on pronunciation clarity."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on speech fluency."),
    overallScore: z.number().min(0).max(90).describe("The overall score. Calculated by averaging a content score (90 for correct, 10 for incorrect) with pronunciation and fluency scores."),
});
export type PteAnswerShortQuestionOutput = z.infer<typeof PteAnswerShortQuestionOutputSchema>;

// --- Respond to a Situation ---
export const PteRespondToSituationInputSchema = z.object({
  situationTranscript: z.string().describe('The transcript of the situation described to the user.'),
  audioDataUri: z.string().describe("A recording of the user's response, as a data URI."),
});
export type PteRespondToSituationInput = z.infer<typeof PteRespondToSituationInputSchema>;

export const PteRespondToSituationOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    contentScore: z.number().min(0).max(90).describe("Score based on the appropriateness, relevance, and completeness of the response to the situation."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on pronunciation clarity."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on speech fluency."),
    feedback: z.string().describe("Specific feedback on the content, pronunciation, and fluency of the response."),
    overallScore: z.number().min(0).max(90).describe("The overall weighted score."),
});
export type PteRespondToSituationOutput = z.infer<typeof PteRespondToSituationOutputSchema>;


// --- Summarize Group Discussion ---
export const PteSummarizeGroupDiscussionInputSchema = z.object({
  discussionTranscript: z.string().describe('The transcript of the group discussion the user listened to.'),
  audioDataUri: z.string().describe("A recording of the user summarizing the discussion, as a data URI."),
});
export type PteSummarizeGroupDiscussionInput = z.infer<typeof PteSummarizeGroupDiscussionInputSchema>;

export const PteSummarizeGroupDiscussionOutputSchema = z.object({
    transcript: z.string().describe("The text transcribed from the user's audio recording."),
    contentScore: z.number().min(0).max(90).describe("Score based on how well the user summarized the main points of the discussion."),
    pronunciationScore: z.number().min(0).max(90).describe("Score based on pronunciation clarity."),
    fluencyScore: z.number().min(0).max(90).describe("Score based on speech fluency."),
    feedback: z.string().describe("Specific feedback on content coverage, pronunciation, and fluency."),
    overallScore: z.number().min(0).max(90).describe("The overall weighted score."),
});
export type PteSummarizeGroupDiscussionOutput = z.infer<typeof PteSummarizeGroupDiscussionOutputSchema>;
