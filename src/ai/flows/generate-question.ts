'use server';

import { z } from 'zod';
import { callWithFallback } from '@/ai/genkit';

const GenerateQuestionInputSchema = z.object({
  examType: z.string().describe('The exam, e.g. PTE'),
  taskType: z.string().describe('The task, e.g. "Write Essay" or "Summarize Text"'),
});
export type GenerateQuestionInput = z.infer<typeof GenerateQuestionInputSchema>;

const GenerateQuestionOutputSchema = z.object({
  title: z.string().describe('A short title for the generated question'),
  content: z
    .string()
    .describe(
      'The question itself — for Write Essay: the essay topic/prompt; for Summarize Text: the full source passage (150-300 words) the student must summarise'
    ),
  timeLimit: z.number().describe('Recommended time limit in minutes (20 for essay, 10 for summarize)'),
});
export type GenerateQuestionOutput = z.infer<typeof GenerateQuestionOutputSchema>;

/** Generates a fresh, exam-realistic practice question for the AI score-test pages. */
export const generateExamQuestion = async (
  input: GenerateQuestionInput
): Promise<GenerateQuestionOutput> => {
  return callWithFallback(async (ai) => {
    const prompt = ai.definePrompt({
      name: 'generateExamQuestionPrompt',
      input: { schema: GenerateQuestionInputSchema },
      output: { schema: GenerateQuestionOutputSchema },
      prompt: (i: GenerateQuestionInput) => `You are an expert ${i.examType} exam content writer.

Generate ONE brand-new, realistic "${i.taskType}" practice question in the authentic style of the ${i.examType} Academic exam.

Rules:
- For "Write Essay": produce a formal argumentative essay prompt on an academic topic (education, technology, society, environment, health, economy). One or two sentences, ending with a clear instruction such as "Discuss both views and give your opinion." Set timeLimit to 20.
- For "Summarize Text": produce an academic source passage of 150-300 words on a factual topic, written like a textbook or article excerpt, suitable for a one-sentence summary. Set timeLimit to 10.
- The question must be original — do not reuse well-known past exam questions verbatim.
- Give it a short descriptive title.`,
    });

    const { output } = await prompt(input);
    if (!output) throw new Error('Question generation returned no output.');
    return output;
  });
};
