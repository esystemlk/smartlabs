'use server';

import { getAi } from '@/ai/genkit';
import { z } from "zod";
import { LMS_URL } from "@/lib/constants";

// Define schemas
const SmartLabsChatInputSchema = z.object({
    message: z.string(),
    mode: z.enum(['general', 'pte', 'ielts', 'celpip']).optional().default('general'),
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

// Detailed Exam Knowledge Base
const EXAM_KNOWLEDGE = `
## EXAM KNOWLEDGE BASE (USE THIS TO ANSWER EXPERT QUERIES)

### 1. PTE ACADEMIC (Pearson Test of English)
- **Scale**: 10-90 (Global Scale of English).
- **Structure**:
  - **Speaking & Writing** (54-67 min): Personal Intro, Read Aloud (RA), Repeat Sentence (RS), Describe Image (DI), Re-tell Lecture (RL), Answer Short Question (ASQ), Summarize Written Text (SWT), Essay.
  - **Reading** (29-30 min): Fill in Blanks (R&W), Multiple Choice, Re-order Paragraphs, Fill in Blanks (R).
  - **Listening** (30-43 min): Summarize Spoken Text (SST), Multiple Choice, Fill in Blanks, Highlight Correct Summary, Select Missing Word, Highlight Incorrect Words, Write from Dictation (WFD).
- **Key Strategies**:
  - **RA**: Fluency > Pronunciation. Don't correct yourself.
  - **RS**: Mimic intonation. Capture 60-70% content.
  - **WFD**: Golden question! Worth huge points. Memorize most repeated lists.

### 2. IELTS (International English Language Testing System)
- **Types**: Academic (Study) vs. General Training (Migration).
- **Scale**: Band 0-9 (0.5 increments).
- **Structure**:
  - **Listening** (30 min): 4 Parts, 40 Questions. Same for both modules.
  - **Reading** (60 min): 3 Sections, 40 Questions. Academic (Long texts) vs GT (Social/Work texts).
  - **Writing** (60 min):
    - Task 1: Academic (Graph/Chart) vs GT (Letter). 150 words.
    - Task 2: Essay. 250 words.
  - **Speaking** (11-14 min): Part 1 (Intro), Part 2 (Cue Card - 2 min), Part 3 (Discussion).
- **Key Tips**:
  - **Writing**: Use complex sentences and wide vocabulary (Lexical Resource). Paragraphing is crucial (Coherence).
  - **Speaking**: Extend answers. don't say just "Yes".

### 3. CELPIP (Canadian English Language Proficiency Index Program)
- **Focus**: Canadian English for PR/Citizenship.
- **Scale**: Levels M, 3-12 (Aligned with CLB).
- **Structure**:
  - **Listening** (47-55 min): 6 Parts + Practice Task.
  - **Reading** (55-60 min): 4 Parts + Practice.
  - **Writing** (53-60 min): Task 1 (Email - 150 words), Task 2 (Survey Response - 150 words).
  - **Speaking** (15-20 min): 8 Tasks (Giving Advice, Talking about Personal Experience, Describing a Scene, Making Predictions, etc.).
- **Key Tips**:
  - **Speaking**: Strict timing. Use prep time wisely. Sound natural and conversational.
  - **Writing**: Tone is key (Formal vs Informal email).
`;

// Export the chat function
// Export the chat function with robust fallback
export async function chatWithSmartLabs(input: SmartLabsChatInput): Promise<SmartLabsChatOutput> {
    const ai = getAi();

    const smartLabsChatPrompt = ai.definePrompt({
        name: 'smartLabsChatPrompt',
        input: { schema: SmartLabsChatInputSchema },
        output: { schema: SmartLabsChatOutputSchema },
        prompt: `You are a helpful AI assistant for Smart Labs, an education institute specializing in English language test preparation.

## CURRENT MODE: {{mode}}
Current focus: {{mode}} exam preparation. Adjust your expertise accordingly.

## ABOUT SMART LABS
- **Mission**: Transform exam preparation through AI-powered learning.
- **Courses**: PTE Academic (Score 79+), IELTS (Band 7.0+), CELPIP (CLB 9+).
- **Features**: AI Scoring, Live Classes, 24/7 Support, 95% Success Rate.
- **Website**: smartlabs.lk
- **Founder**: Lahiruka Weeraratne (Pearson Trained)

${EXAM_KNOWLEDGE}

## YOUR ROLE
- **Expertise**: Act as a senior tutor for {{mode}}. If mode is 'general', be a helpful guide.
- **Answer questions** about courses, pricing, and enrollment.
- **Research Simulation**: Use the provided Knowledge Base to give detailed, specific answers about exam structures and question types. Don't be vague.
- **Style**: Professional, encouraging, and friendly. Be concise (max 2-3 paragraphs). Use markdown for clarity.
- **Constraint**: If asked for specific exam questions, provide *examples* similar to real ones (simulated), but clarify they are practice examples.
- **Action**: Encourage users to take the free diagnostic test.
- Use emojis occasionally 😊.

## CONVERSATION HISTORY
{{#each conversationHistory}}
{{role}}: {{content}}
{{/each}}

## USER MESSAGE
user: {{message}}

## RESPONSE FORMAT
Return a JSON object with:
- "response": Your helpful response. Use Markdown for formatting (bold, lists).
- "suggestedActions": An array of 1-3 objects: { "label": string, "url"?: string, "intent"?: string }. Prefer internal links for known pages: "/courses", "/resources", "/enroll", "/apps", "/videos", "/dashboard".
- "context": A single word describing the conversation context (e.g., "courses", "pricing", "enrollment", "support", "general", "pte", "ielts", "celpip").`,
    });

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
        let actions: any[] = [
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
                { label: 'Enroll', url: LMS_URL, intent: 'enrollment' },
                { label: 'Schedule', url: '/schedule', intent: 'schedule' }
            ];
            context = 'enrollment';
        } else if (lowerMessage.includes('pte')) {
            fallbackResponse = "PTE Academic is a computer-based English test. It assesses Speaking, Writing, Reading, and Listening. We offer AI-scored mock tests and expert classes. Ask me specifically about 'PTE Speaking' or 'PTE Scoring'!";
            actions = [
                { label: 'PTE Speaking Tips', intent: 'pte' },
                { label: 'PTE Essay Templates', intent: 'pte' },
                { label: 'Book PTE Class', url: LMS_URL, intent: 'enrollment' }
            ];
            context = 'pte';
        } else if (lowerMessage.includes('ielts')) {
            fallbackResponse = "IELTS comes in Academic (Study) and General (Migration) modules. Key to high bands is lexical resource and coherence. How can I help with your IELTS prep?";
            actions = [
                { label: 'IELTS Writing Task 2', intent: 'ielts' },
                { label: 'IELTS Speaking', intent: 'ielts' },
                { label: 'Book IELTS Class', url: LMS_URL, intent: 'enrollment' }
            ];
            context = 'ielts';
        } else if (lowerMessage.includes('celpip')) {
            fallbackResponse = "CELPIP is designed for Canadian immigration. It focuses on functional English. Our course covers all 8 speaking tasks and both writing tasks perfectly.";
            actions = [
                { label: 'CELPIP Speaking Tasks', intent: 'celpip' },
                { label: 'CELPIP Email Writing', intent: 'celpip' },
                { label: 'Book CELPIP Class', url: LMS_URL, intent: 'enrollment' }
            ];
            context = 'celpip';
        }

        return {
            response: fallbackResponse,
            suggestedActions: actions,
            context: context
        };
    }
}
