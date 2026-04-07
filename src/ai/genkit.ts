import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Safely get API key
const getApiKey = () => {
  const key = process.env.GOOGLE_GENAI_API_KEY;
  if (!key && typeof window === 'undefined') {
    console.warn("WARNING: GOOGLE_GENAI_API_KEY is not defined. AI features will fail.");
  }
  return key || "missing-api-key";
};

// Singleton to prevent module-level crashes
let aiInstance: any = null;

export const getAi = () => {
  if (!aiInstance) {
    try {
      aiInstance = genkit({
        plugins: [
          googleAI({
            apiKey: getApiKey(),
          }),
        ],
        // Updated to Gemini 2.5 Flash for superior performance (Stable 2026)
        model: 'googleai/gemini-2.5-flash',
      });
    } catch (error) {
      console.error('Failed to initialize Genkit:', error);
      throw new Error('AI Engine initialization failed. Please check your GOOGLE_GENAI_API_KEY.');
    }
  }
  return aiInstance;
};

// For backward compatibility while refactoring
export const ai = new Proxy({} as any, {
  get: (target, prop) => {
    return (getAi() as any)[prop];
  }
});
