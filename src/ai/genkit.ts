import { genkit } from 'genkit';
import { googleAI } from '@genkit-ai/googleai';

// Safely get API key, avoiding crashes if it's missing during SSR
const getApiKey = () => {
  const key = process.env.GOOGLE_GENAI_API_KEY;
  if (!key && typeof window === 'undefined') {
    console.warn("WARNING: GOOGLE_GENAI_API_KEY is not defined in environment variables. AI features will fail.");
  }
  return key;
};

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: getApiKey(),
    }),
  ],
  // Use string identifier for the model for maximum compatibility
  model: 'googleai/gemini-1.5-flash',
});
