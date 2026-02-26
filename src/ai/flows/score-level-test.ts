'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const LevelTestScoringSchema = z.object({
    sentences: z.array(z.object({
        id: z.number(),
        score: z.number(), // 0 or 1
        feedback: z.string()
    })),
    speaking: z.object({
        readAloudPronunciation: z.number(), // 0 to 2.5
        readAloudFluency: z.number(), // 0 to 2.5
        taskGrammar: z.number(), // 0 to 2.5
        taskVocabulary: z.number(), // 0 to 2.5
        taskSentenceStructure: z.number(), // 0 to 2.5
        taskPronunciationFluency: z.number(), // 0 to 2.5
        overallFeedback: z.string(),
        transcript: z.string().optional()
    }),
    diagnostic: z.object({
        grammarLevel: z.enum(['Weak', 'Basic', 'Good', 'Advanced']),
        sentenceComplexity: z.enum(['Simple', 'Compound', 'Complex', 'Academic']),
        vocabularyLevel: z.enum(['Limited', 'Functional', 'Academic']),
        pronunciation: z.enum(['Poor', 'Understandable', 'Clear', 'Fluent']),
        summary: z.string()
    })
});

export type LevelTestScoring = z.infer<typeof LevelTestScoringSchema>;

const levelTestScoringPrompt = ai.definePrompt({
    name: 'levelTestScoringPrompt',
    input: {
        schema: z.object({
            sentences: z.array(z.object({
                id: z.number(),
                task: z.string(),
                answer: z.string()
            })),
            speaking: z.object({
                readAloudText: z.string(),
                speechTask: z.string(),
                audioDataUri: z.string(), // Base64 audio
            })
        })
    },
    output: { schema: LevelTestScoringSchema },
    prompt: `
        You are an expert IELTS and PTE examiner. Your task is to score a student's level test.
        
        ### Section 4: Sentence Construction (5 Marks Total)
        Scoring Criteria: 1 mark per sentence if it has correct grammar AND meets the requested structure.
        Tasks and Student Answers:
        {{#each sentences}}
        ID {{id}}: {{task}}
        Answer: {{answer}}
        {{/each}}
        
        ### Section 6: Speaking (15 Marks Total)
        The student performed two tasks recorded in the provided audio:
        1. Read Aloud Task: "{{speaking.readAloudText}}"
        2. Topic Speech Task: "{{speaking.speechTask}}"
        
        Analyze the provided audio for both tasks and score as follows:
        
        Task 1: Read Aloud (5 Marks)
        - Pronunciation: (0 to 2.5 Marks)
        - Fluency: (0 to 2.5 Marks)
        
        Task 2: Topic Speech (10 Marks)
        - Grammar: (0 to 2.5 Marks)
        - Vocabulary: (0 to 2.5 Marks)
        - Sentence Structure: (0 to 2.5 Marks)
        - Pronunciation & Fluency: (0 to 2.5 Marks)
        
        Total Speaking Marks: (15 Marks)
        
        Provide a diagnostic report:
        - Grammar Level: Weak / Basic / Good / Advanced
        - Sentence Complexity: Simple / Compound / Complex / Academic
        - Vocabulary Level: Limited / Functional / Academic
        - Pronunciation: Poor / Understandable / Clear / Fluent
        
        Return the transcript of what you heard as well.
        
        Here is the user's audio recording:
        {{media url=speaking.audioDataUri}}
      `,
});

const scoreLevelTestFlow = ai.defineFlow(
    {
        name: 'scoreLevelTestFlow',
        inputSchema: z.object({
            sentences: z.array(z.object({
                id: z.number(),
                task: z.string(),
                answer: z.string()
            })),
            speaking: z.object({
                readAloudText: z.string(),
                speechTask: z.string(),
                audioDataUri: z.string(), // Base64 audio
            })
        }),
        outputSchema: LevelTestScoringSchema,
    },
    async (input) => {
        try {
            console.log('Starting Level Test Scoring Flow...');
            console.log('Sentence count:', input.sentences.length);
            console.log('Audio data available:', !!input.speaking.audioDataUri);

            const { output } = await levelTestScoringPrompt(input);
            if (!output) {
                console.error('AI output was empty for level test scoring');
                throw new Error('AI failed to generate a score for the level test.');
            }

            console.log('Scoring successful!');
            return output;
        } catch (error) {
            console.error('Error in scoreLevelTestFlow:', error);
            throw error;
        }
    }
);

export async function scoreLevelTest(input: any): Promise<LevelTestScoring> {
    return await scoreLevelTestFlow(input);
}
