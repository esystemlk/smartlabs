'use server';

// Types for the scoring result
export type LevelTestScoring = {
    sentences: { id: number; score: number; feedback: string }[];
    speaking: {
        readAloudPronunciation: number;
        readAloudFluency: number;
        taskGrammar: number;
        taskVocabulary: number;
        taskSentenceStructure: number;
        taskPronunciationFluency: number;
        overallFeedback: string;
        transcript?: string;
    };
    diagnostic: {
        grammarLevel: 'Weak' | 'Basic' | 'Good' | 'Advanced';
        sentenceComplexity: 'Simple' | 'Compound' | 'Complex' | 'Academic';
        vocabularyLevel: 'Limited' | 'Functional' | 'Academic';
        pronunciation: 'Poor' | 'Understandable' | 'Clear' | 'Fluent';
        summary: string;
    };
};

/**
 * Scores a sentence based on basic heuristics when AI is unavailable.
 */
function scoreSentenceLocally(task: string, answer: string): { score: number; feedback: string } {
    if (!answer || answer.trim().length < 3) {
        return { score: 0, feedback: 'No answer or answer too short.' };
    }

    const trimmed = answer.trim();
    const words = trimmed.split(/\s+/).length;
    const hasCapital = /^[A-Z]/.test(trimmed);
    const hasPeriod = /[.!?]$/.test(trimmed);
    const taskLower = task.toLowerCase();

    // Check for required conjunctions based on task
    let structureOk = true;
    if (taskLower.includes('compound') && !/(and|but|so|or|yet)/i.test(trimmed)) {
        structureOk = false;
    }
    if (taskLower.includes('complex') && !/(because|although|since|while|when|if|unless|after|before)/i.test(trimmed)) {
        structureOk = false;
    }
    if (taskLower.includes('therefore') || taskLower.includes('as a result')) {
        if (!/(therefore|as a result|consequently|hence|thus)/i.test(trimmed)) {
            structureOk = false;
        }
    }

    if (words >= 5 && hasCapital && hasPeriod && structureOk) {
        return { score: 1, feedback: 'Sentence meets the basic requirements for grammar and structure.' };
    } else if (words >= 5 && structureOk) {
        return { score: 1, feedback: 'Sentence structure is acceptable. Minor formatting issues noted.' };
    } else {
        return { score: 0, feedback: `Answer needs improvement: ${!structureOk ? 'Missing required sentence structure. ' : ''}${words < 5 ? 'Too short. ' : ''}${!hasPeriod ? 'Missing punctuation. ' : ''}` };
    }
}

/**
 * Generates a local fallback scoring result.
 */
function getLocalScoring(
    sentences: { id: number; task: string; answer: string }[],
    hasAudio: boolean
): LevelTestScoring {
    const sentenceResults = sentences.map(s => ({
        id: s.id,
        ...scoreSentenceLocally(s.task, s.answer)
    }));

    const sentenceTotal = sentenceResults.reduce((sum, s) => sum + s.score, 0);

    // Determine grammar level from sentence scores
    let grammarLevel: LevelTestScoring['diagnostic']['grammarLevel'] = 'Weak';
    if (sentenceTotal >= 4) grammarLevel = 'Advanced';
    else if (sentenceTotal >= 3) grammarLevel = 'Good';
    else if (sentenceTotal >= 2) grammarLevel = 'Basic';

    // Determine sentence complexity
    let sentenceComplexity: LevelTestScoring['diagnostic']['sentenceComplexity'] = 'Simple';
    const hasCompound = sentences.some(s => /(and|but|so|or|yet)/i.test(s.answer || ''));
    const hasComplex = sentences.some(s => /(because|although|since|while|when|if|unless)/i.test(s.answer || ''));
    if (hasComplex) sentenceComplexity = 'Complex';
    else if (hasCompound) sentenceComplexity = 'Compound';

    const avgWords = sentences.reduce((sum, s) => sum + (s.answer?.split(/\s+/).length || 0), 0) / Math.max(sentences.length, 1);
    let vocabularyLevel: LevelTestScoring['diagnostic']['vocabularyLevel'] = 'Limited';
    if (avgWords > 15) vocabularyLevel = 'Academic';
    else if (avgWords > 8) vocabularyLevel = 'Functional';

    return {
        sentences: sentenceResults,
        speaking: {
            readAloudPronunciation: 0,
            readAloudFluency: 0,
            taskGrammar: 0,
            taskVocabulary: 0,
            taskSentenceStructure: 0,
            taskPronunciationFluency: 0,
            overallFeedback: hasAudio
                ? 'Your audio recording was received. AI audio analysis is temporarily unavailable. Your speaking section will be reviewed by a teacher for accurate scoring.'
                : 'No audio recording was submitted. Please record your responses for the speaking section to receive a score.',
            transcript: ''
        },
        diagnostic: {
            grammarLevel,
            sentenceComplexity,
            vocabularyLevel,
            pronunciation: hasAudio ? 'Understandable' : 'Poor',
            summary: `Based on your written responses, your grammar level is ${grammarLevel.toLowerCase()} with ${sentenceComplexity.toLowerCase()} sentence structures. You scored ${sentenceTotal}/5 on sentence construction. ${hasAudio ? 'Your speaking recording has been saved for teacher review.' : 'No speaking recording was submitted.'} Overall vocabulary usage is ${vocabularyLevel.toLowerCase()}.`
        }
    };
}

/**
 * Attempts AI scoring, falls back to local scoring if unavailable.
 */
export async function scoreLevelTest(input: {
    sentences: { id: number; task: string; answer: string }[];
    speaking: { readAloudText: string; speechTask: string; audioDataUri: string };
}): Promise<LevelTestScoring> {
    const hasAudio = !!(input.speaking.audioDataUri &&
        input.speaking.audioDataUri.length > 100 &&
        input.speaking.audioDataUri.startsWith('data:'));

    console.log('[LevelTest] Starting scoring...');
    console.log('[LevelTest] Sentences:', input.sentences.length);
    console.log('[LevelTest] Has audio:', hasAudio);

    try {
        // Dynamically import AI to prevent module-level crash
        const { ai } = await import('@/ai/genkit');
        const { z } = await import('zod');

        const ScoringSchema = z.object({
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

        const sentenceBlock = input.sentences.map(s =>
            `ID ${s.id}: Task: "${s.task}" | Student Answer: "${s.answer}"`
        ).join('\n');

        const promptText = `You are an expert IELTS and PTE examiner. Score a student's level test.

### Section 4: Sentence Construction (5 Marks Total)
Scoring: 1 mark per sentence if correct grammar AND meets the requested structure.

${sentenceBlock}

### Section 6: Speaking (15 Marks Total)
${hasAudio ? `The student's audio recording was provided. They performed two tasks:
1. Read Aloud: "${input.speaking.readAloudText}"
2. Topic Speech: "${input.speaking.speechTask}"

Score the speaking:
- readAloudPronunciation: 0 to 2.5
- readAloudFluency: 0 to 2.5
- taskGrammar: 0 to 2.5
- taskVocabulary: 0 to 2.5
- taskSentenceStructure: 0 to 2.5
- taskPronunciationFluency: 0 to 2.5` : `No audio was provided. Set ALL speaking scores to 0.`}

Provide diagnostic: grammarLevel (Weak/Basic/Good/Advanced), sentenceComplexity (Simple/Compound/Complex/Academic), vocabularyLevel (Limited/Functional/Academic), pronunciation (${hasAudio ? 'Poor/Understandable/Clear/Fluent' : 'Poor since no audio'}).
Include a transcript of what you heard (if audio was provided) and an overall summary.`;

        let result;

        if (hasAudio) {
            result = await ai.generate({
                output: { schema: ScoringSchema },
                prompt: [
                    { media: { url: input.speaking.audioDataUri } },
                    { text: promptText }
                ]
            });
        } else {
            result = await ai.generate({
                output: { schema: ScoringSchema },
                prompt: promptText
            });
        }

        if (result.output) {
            console.log('[LevelTest] AI scoring complete!');
            return result.output as LevelTestScoring;
        }

        console.warn('[LevelTest] AI returned empty output, using local scoring');
        return getLocalScoring(input.sentences, hasAudio);
    } catch (error: any) {
        console.error('[LevelTest] AI scoring failed, using local fallback:', error?.message || String(error));
        return getLocalScoring(input.sentences, hasAudio);
    }
}
