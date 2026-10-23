import { AsyncLocalStorage } from 'node:async_hooks';

// Request-local credentials: never mutate process.env or expose a provider key to the browser.
// Individual practice requests have no context and continue using their existing key pool.
const mockAi = new AsyncLocalStorage<{ apiKey: string }>();
export const currentMockAiKey = () => mockAi.getStore()?.apiKey;
export const hasMockAiKey = () => !!process.env.GOOGLE_GENAI_API_KEY_6?.trim();
export function withMockAiKey<T>(run: () => Promise<T>): Promise<T> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY_6?.trim();
  if (!apiKey) throw new Error('Mock AI key 6 is not configured.');
  return mockAi.run({ apiKey },run);
}
