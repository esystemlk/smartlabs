'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define schemas
const GenerateQuestionInputSchema = z.object({
    examType: z.enum(['PTE', 'IELTS', 'CELPIP']),
    taskType: z.string(), // e.g., 'Write Essay', 'Summarize Text'
});

const GenerateQuestionOutputSchema = z.object({
    title: z.string(),
    content: z.string(), // The main question content/text
    answer: z.string().optional(),
    instructions: z.string(),
    timeLimit: z.number(), // in minutes
    difficulty: z.enum(['Medium', 'Hard', 'Expert']),
    tags: z.array(z.string()).optional()
});

export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;
export type GenerateQuestionOutput = z.infer<typeof GenerateQuestionOutputSchema>;

// Define the prompt
const generateQuestionPrompt = ai.definePrompt({
    name: 'generateQuestion',
    input: { schema: GenerateQuestionInputSchema },
    output: { schema: GenerateQuestionOutputSchema },
    prompt: `You are an expert exam designer for {{examType}} (Pearson Test of English / IELTS / CELPIP).
    Your goal is to generate a highly realistic, "Real Exam Level" practice question for the task: {{taskType}}.

    ## CRITERIA FOR REALISM
    1. **Topic Selection**: Choose a topic that is statistically **most repeated** or **trending** in actual exams for 2024-2026. Avoid generic topics.
       - Common themes: Technology, Environment, Urbanization, Education, Globalization.
    2. **Complexity**:
       - For PTE 'Write Essay', use complex argumentative prompts.
       - For PTE 'Summarize Text', use dense academic texts (approx 200-300 words) with complex sentence structures.
       - For IELTS 'Task 2', use 'Opinion' or 'Discussion' type questions.
    3. **Tone**: Strictly academic and formal.

    ## OUTPUT FORMAT
    Return a JSON object with:
    - title: A short title (e.g., "Remote Working Effects").
    - content: The actual text/prompt the student must read or respond to.
    - answer: (Optional) The correct answer if valid for the task (e.g. for "Answer Short Question").
    - instructions: Specific exam instructions (e.g., "Write 200-300 words").
    - timeLimit: Standard exam time limit for this section (in minutes).
    - difficulty: Estimate difficulty based on vocabulary and logic.
    - tags: Array of keywords (e.g., ["Technology", "Repeated Question"]).
    `
});

// Export the function
export async function generateExamQuestion(input: GenerateQuestionInput): Promise<GenerateQuestionOutput> {
    const { output } = await generateQuestionPrompt(input);
    if (!output) {
        throw new Error('Failed to generate question');
    }
    return output;
}
