import { z } from 'zod';

export const AiTutorChatSchema = z.object({
    courseId: z.string().describe('The course ID (pte, ielts, celpip)'),
    messages: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string()
    })).describe('The conversation history'),
});

export type AiTutorChatInput = z.infer<typeof AiTutorChatSchema>;
