import { AsyncLocalStorage } from 'node:async_hooks';

// Request-local credentials: never mutate process.env or expose a provider key to the browser.
// Individual practice requests have no context and continue using their existing key pool.
const mockAi = new AsyncLocalStorage<{ apiKey: string }>();
export const currentMockAiKey = () => mockAi.getStore()?.apiKey;
// AI marking is ready if the dedicated key 6 OR the normal pool (key 1 / legacy)
// is configured — the mock falls back to the pool so it never dead-ends.
export const hasMockAiKey = () =>
  !!(process.env.GOOGLE_GENAI_API_KEY_6?.trim() || process.env.GOOGLE_GENAI_API_KEY_1?.trim() || process.env.GOOGLE_GENAI_API_KEY?.trim());
export function withMockAiKey<T>(run: () => Promise<T>): Promise<T> {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY_6?.trim();
  // Prefer the dedicated key 6; if it isn't set, run without a mock context so
  // the key selectors fall through to the normal pool instead of dead-ending.
  return apiKey ? mockAi.run({ apiKey }, run) : run();
}
