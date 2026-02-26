'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

export const LevelTestScoringSchema = z.object({
    sentences: z.array(z.object({
        id: z.number(),
        score: z.number(),
        feedback: z.string()
    })),
    speaking: z.object({
        readAloudPronunciation: z.number(),
        readAloudFluency: z.number(),
        taskGrammar: z.number(),
        taskVocabulary: z.number(),
        taskSentenceStructure: z.number(),
        taskPronunciationFluency: z.number(),
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

function getFallbackScoring(sentences: { id: number; task: string; answer: string }[]): LevelTestScoring {
    return {
        sentences: sentences.map(s => ({
            id: s.id,
            score: s.answer && s.answer.trim().length > 5 ? 1 : 0,
            feedback: s.answer && s.answer.trim().length > 5
                ? 'Answer submitted - basic scoring applied (AI temporarily unavailable).'
                : 'No answer or answer too short.'
        })),
        speaking: {
            readAloudPronunciation: 0,
            readAloudFluency: 0,
            taskGrammar: 0,
            taskVocabulary: 0,
            taskSentenceStructure: 0,
            taskPronunciationFluency: 0,
            overallFeedback: 'AI scoring was temporarily unavailable. Your speaking will be reviewed manually by a teacher.',
            transcript: ''
        },
        diagnostic: {
            grammarLevel: 'Basic',
            sentenceComplexity: 'Simple',
            vocabularyLevel: 'Limited',
            pronunciation: 'Poor',
            summary: 'AI scoring encountered a temporary issue. A basic evaluation was applied. Your teacher will review your full results and provide a detailed assessment.'
        }
    };
}

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

        if (hasAudio) {
            // Score WITH audio using ai.generate directly (no module-level prompt)
            const { output } = await ai.generate({
                output: { schema: LevelTestScoringSchema },
                prompt: [
                    {
                        media: { url: input.speaking.audioDataUri }
                    },
                    {
                        text: `You are an expert IELTS and PTE examiner. Score a student's level test.

### Section 4: Sentence Construction (5 Marks Total)
Scoring: 1 mark per sentence if correct grammar AND meets the requested structure.

${input.sentences.map(s => `ID ${s.id}: Task: "${s.task}" | Answer: "${s.answer}"`).join('\n')}

### Section 6: Speaking (15 Marks Total)
The student's audio recording was provided above. They performed two tasks:
1. Read Aloud: "${input.speaking.readAloudText}"
2. Topic Speech: "${input.speaking.speechTask}"

Score the speaking as follows:
- Read Aloud Pronunciation: 0 to 2.5
- Read Aloud Fluency: 0 to 2.5
- Task Grammar: 0 to 2.5
- Task Vocabulary: 0 to 2.5
- Task Sentence Structure: 0 to 2.5
- Task Pronunciation & Fluency: 0 to 2.5

Provide diagnostic: Grammar Level (Weak/Basic/Good/Advanced), Sentence Complexity (Simple/Compound/Complex/Academic), Vocabulary Level (Limited/Functional/Academic), Pronunciation (Poor/Understandable/Clear/Fluent).
Include a transcript of what you heard and an overall summary.`
                    }
                ]
            });

            if (output) {
                console.log('[LevelTest] AI scoring with audio complete!');
                return output;
            }
        } else {
            // Score WITHOUT audio
            const { output } = await ai.generate({
                output: { schema: LevelTestScoringSchema },
                prompt: `You are an expert IELTS and PTE examiner. Score a student's level test.

### Section 4: Sentence Construction (5 Marks Total)
Scoring: 1 mark per sentence if correct grammar AND meets the requested structure.

${input.sentences.map(s => `ID ${s.id}: Task: "${s.task}" | Answer: "${s.answer}"`).join('\n')}

### Section 6: Speaking (15 Marks Total)
No audio was provided by the student. Set ALL speaking scores to 0.
The tasks were:
1. Read Aloud: "${input.speaking.readAloudText}"
2. Speech: "${input.speaking.speechTask}"

Since no audio was submitted, all speaking scores must be 0. Feedback should note that no recording was submitted.

Provide diagnostic based on writing only: Grammar Level (Weak/Basic/Good/Advanced), Sentence Complexity (Simple/Compound/Complex/Academic), Vocabulary Level (Limited/Functional/Academic), Pronunciation: Poor (no audio).
Include a summary.`
            });

            if (output) {
                console.log('[LevelTest] AI scoring without audio complete!');
                return output;
            }
        }

        console.error('[LevelTest] AI returned empty output');
        return getFallbackScoring(input.sentences);
    } catch (error: any) {
        console.error('[LevelTest] Error in scoring:', error?.message || error);
        return getFallbackScoring(input.sentences);
    }
}
