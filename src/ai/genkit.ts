import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI()],
  // Use string identifier for the new 2.0 Flash model
  model: 'googleai/gemini-2.0-flash',
});
