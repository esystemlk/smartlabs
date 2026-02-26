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

// Prompt WITH audio
const levelTestScoringWithAudioPrompt = ai.definePrompt({
    name: 'levelTestScoringWithAudioPrompt',
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
                audioDataUri: z.string(),
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

// Prompt WITHOUT audio (fallback for text-only scoring)
const levelTestScoringTextOnlyPrompt = ai.definePrompt({
    name: 'levelTestScoringTextOnlyPrompt',
    input: {
        schema: z.object({
            sentences: z.array(z.object({
                id: z.number(),
                task: z.string(),
                answer: z.string()
            })),
            speakingReadAloudText: z.string(),
            speakingSpeechTask: z.string(),
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
        NOTE: No audio was provided by the student. Give 0 marks for all speaking categories.
        The student was supposed to:
        1. Read Aloud: "{{speakingReadAloudText}}"
        2. Speak about: "{{speakingSpeechTask}}"
        
        Since no audio was provided, set all speaking scores to 0 and provide feedback that no recording was submitted.
        
        Provide a diagnostic report:
        - Grammar Level: Weak / Basic / Good / Advanced
        - Sentence Complexity: Simple / Compound / Complex / Academic
        - Vocabulary Level: Limited / Functional / Academic
        - Pronunciation: Poor (since no audio submitted)
      `,
});

export async function scoreLevelTest(input: {
    sentences: { id: number; task: string; answer: string }[];
    speaking: { readAloudText: string; speechTask: string; audioDataUri: string };
}): Promise<LevelTestScoring> {
    try {
        const hasAudio = input.speaking.audioDataUri &&
            input.speaking.audioDataUri.length > 100 &&
            input.speaking.audioDataUri.startsWith('data:');

        console.log('[LevelTest] Starting scoring...');
        console.log('[LevelTest] Sentences:', input.sentences.length);
        console.log('[LevelTest] Has audio:', hasAudio);
        console.log('[LevelTest] Audio URI length:', input.speaking.audioDataUri?.length || 0);

        let output: LevelTestScoring | null = null;

        if (hasAudio) {
            console.log('[LevelTest] Scoring with audio...');
            const result = await levelTestScoringWithAudioPrompt(input);
            output = result.output;
        } else {
            console.log('[LevelTest] Scoring WITHOUT audio (text only)...');
            const result = await levelTestScoringTextOnlyPrompt({
                sentences: input.sentences,
                speakingReadAloudText: input.speaking.readAloudText,
                speakingSpeechTask: input.speaking.speechTask,
            });
            output = result.output;
        }

        if (!output) {
            console.error('[LevelTest] AI returned empty output, using fallback...');
            return getFallbackScoring(input.sentences);
        }

        console.log('[LevelTest] Scoring complete!');
        return output;
    } catch (error: any) {
        console.error('[LevelTest] Error in scoring:', error?.message || error);
        // Return a fallback score so the test doesn't crash
        return getFallbackScoring(input.sentences);
    }
}

function getFallbackScoring(sentences: { id: number; task: string; answer: string }[]): LevelTestScoring {
    return {
        sentences: sentences.map(s => ({
            id: s.id,
            score: s.answer && s.answer.trim().length > 5 ? 1 : 0,
            feedback: s.answer && s.answer.trim().length > 5
                ? 'Answer submitted - basic scoring applied (AI unavailable).'
                : 'No answer or answer too short.'
        })),
        speaking: {
            readAloudPronunciation: 0,
            readAloudFluency: 0,
            taskGrammar: 0,
            taskVocabulary: 0,
            taskSentenceStructure: 0,
            taskPronunciationFluency: 0,
            overallFeedback: 'AI scoring was unavailable. Please contact support for a manual review of your speaking section.',
            transcript: ''
        },
        diagnostic: {
            grammarLevel: 'Basic',
            sentenceComplexity: 'Simple',
            vocabularyLevel: 'Limited',
            pronunciation: 'Poor',
            summary: 'AI scoring encountered an issue. This is a basic fallback report. Please contact the team for a full diagnostic.'
        }
    };
}
