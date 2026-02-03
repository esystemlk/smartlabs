'use server';

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define schemas
const SmartLabsChatInputSchema = z.object({
    message: z.string(),
    conversationHistory: z.array(z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
    })).optional(),
});

const SmartLabsChatOutputSchema = z.object({
    response: z.string(),
    suggestedActions: z.array(z.string()).optional(),
});

export type SmartLabsChatInput = z.infer<typeof SmartLabsChatInputSchema>;
export type SmartLabsChatOutput = z.infer<typeof SmartLabsChatOutputSchema>;

// Define the prompt with structured output
const smartLabsChatPrompt = ai.definePrompt({
    name: 'smartLabsChatPrompt',
    input: { schema: SmartLabsChatInputSchema },
    output: { schema: SmartLabsChatOutputSchema },
    prompt: `You are a helpful AI assistant for Smart Labs, an education institute specializing in English language test preparation.

## ABOUT SMART LABS
- **Mission**: Transform exam preparation through AI-powered learning.
- **Courses**: PTE Academic (Score 79+), IELTS (Band 7.0+), CELPIP (CLB 9+).
- **Features**: AI Scoring, Live Classes, 24/7 Support, 95% Success Rate.
- **Website**: smartlabs.lk
- **Founder**: Lahiruka Weeraratne (Pearson Trained)

## YOUR ROLE
- Answer questions about courses, pricing, and enrollment.
- Be friendly, professional, and concise (max 2-3 paragraphs).
- Encourage users to take the free diagnostic test.
- Use emojis occasionally 😊.

## CONVERSATION HISTORY
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}

## USER MESSAGE
user: {{message}}

## RESPONSE FORMAT
Return a JSON object with:
- "response": Your helpful response to the user.
- "suggestedActions": An array of 1-3 short follow-up questions or actions the user might want to take (e.g. "Tell me about PTE", "Pricing details", "Sign up").`,
});

// Export the chat function
export async function chatWithSmartLabs(input: SmartLabsChatInput): Promise<SmartLabsChatOutput> {
    const { output } = await smartLabsChatPrompt(input);
    if (!output) {
        throw new Error('Failed to generate response');
    }
    return output;
}
