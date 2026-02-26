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
        pronunciationScore: z.number(), // 0 or 1
        fluencyScore: z.number(), // 0 or 1 (no long pauses)
        grammarScore: z.number(), // 0 or 1
        vocabularyScore: z.number(), // 0 or 1
        sentenceStructureScore: z.number(), // 0 or 1
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
        
        Section 4: Sentence Construction (5 Marks)
        Scoring Criteria: 1 mark per sentence if it has correct grammar AND meets the requested structure.
        Tasks and Student Answers:
        {{#each sentences}}
        ID {{id}}: {{task}}
        Answer: {{answer}}
        {{/each}}
        
        Section 6: Speaking (5 Marks Total)
        The student performed two tasks:
        1. Read Aloud: "{{speaking.readAloudText}}"
        2. Speech Task: "{{speaking.speechTask}}"
        
        Analyze the provided audio for both tasks.
        
        Speaking Scoring Checklist (1 mark each):
        - Pronunciation clear
        - Speaks without long pauses (fluency)
        - Uses correct grammar
        - Uses topic vocabulary
        - Speaks in full sentences
        
        Provide a diagnostic report:
        - Grammar Level: Weak / Basic / Good / Advanced
        - Sentence Complexity: Simple / Compound / Complex / Academic
        - Vocabulary Level: Limited / Functional / Academic
        - Pronunciation: Poor / Understandable / Clear / Fluent
        
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
        const { output } = await levelTestScoringPrompt(input);
        if (!output) {
            throw new Error('AI failed to generate a score for the level test.');
        }
        return output;
    }
);

export async function scoreLevelTest(input: any): Promise<LevelTestScoring> {
    return await scoreLevelTestFlow(input);
}
