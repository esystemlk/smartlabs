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

const SuggestedActionSchema = z.object({
    label: z.string(),
    url: z.string().optional(),
    intent: z.string().optional(),
});

const SmartLabsChatOutputSchema = z.object({
    response: z.string(),
    suggestedActions: z.array(SuggestedActionSchema).optional(),
    context: z.string().optional(),
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
- Be friendly, professional, and concise (max 2-3 paragraphs). Use markdown for clarity when useful.
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
- "suggestedActions": An array of 1-3 objects: { "label": string, "url"?: string, "intent"?: string }. Prefer internal links for known pages: "/courses", "/resources", "/enroll", "/apps", "/videos", "/dashboard".
- "context": A single word describing the conversation context (e.g., "courses", "pricing", "enrollment", "support", "general").`,
});

// Export the chat function
// Export the chat function with robust fallback
export async function chatWithSmartLabs(input: SmartLabsChatInput): Promise<SmartLabsChatOutput> {
    try {
        const { output } = await smartLabsChatPrompt(input);
        if (!output) {
            throw new Error('Failed to generate response');
        }
        return output;
    } catch (error) {
        console.error('AI Service Error:', error);

        const lowerMessage = input.message.toLowerCase();
        let fallbackResponse = "I'm currently experiencing high traffic, but I can still help you! Please visit our Courses page for detailed information or use our enrollment portal.";
        let actions = [
            { label: 'View Courses', url: '/courses', intent: 'courses' },
            { label: 'Enroll', url: '/enroll', intent: 'enrollment' }
        ];
        let context = 'general';

        if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('fee')) {
            fallbackResponse = "Our pricing plans are flexible and affordable. We offer packages for PTE, IELTS, and CELPIP tailored to your needs. You can proceed to enrollment or browse courses.";
            actions = [
                { label: 'Browse Courses', url: '/courses', intent: 'courses' },
                { label: 'Enroll Now', url: '/enroll', intent: 'enrollment' }
            ];
            context = 'pricing';
        } else if (lowerMessage.includes('course') || lowerMessage.includes('pte') || lowerMessage.includes('ielts') || lowerMessage.includes('celpip')) {
            fallbackResponse = "We offer comprehensive courses for PTE, IELTS, and CELPIP. Each course includes AI-powered practice, live classes, and expert feedback. Which exam are you preparing for?";
            actions = [
                { label: 'View Courses', url: '/courses', intent: 'courses' },
                { label: 'Resources', url: '/resources', intent: 'resources' }
            ];
            context = 'courses';
        } else if (lowerMessage.includes('book') || lowerMessage.includes('schedule') || lowerMessage.includes('register')) {
            fallbackResponse = "You can easily register for a course through our enrollment page. Our team gets back to you within 24 hours!";
            actions = [
                { label: 'Enroll', url: '/enroll', intent: 'enrollment' },
                { label: 'Schedule', url: '/schedule', intent: 'schedule' }
            ];
            context = 'enrollment';
        }

        return {
            response: fallbackResponse,
            suggestedActions: actions,
            context: context
        };
    }
}
