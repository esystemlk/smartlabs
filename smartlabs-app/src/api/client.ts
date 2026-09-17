import { auth } from '@/firebase';
import { API_BASE_URL } from '@/config';

export class ApiError extends Error {
  status: number;
  code?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  constructor(message: string, status: number, code?: string, data?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.data = data as any;
  }
}

async function authHeader(): Promise<Record<string, string>> {
  const user = auth.currentUser;
  if (!user) throw new ApiError('You are signed out. Please sign in again.', 401, 'NO_AUTH');
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}` };
}

// React Native's fetch never times out on its own, so a stalled AI request (essay
// scoring can run 60–120s, speaking uploads a large audio blob) would spin the UI
// forever. Abort after a generous window and surface a clear, retryable error.
const DEFAULT_TIMEOUT_MS = 20_000;
const AI_TIMEOUT_MS = 150_000;

/** Longer budget for the AI scoring endpoints, which legitimately run slowly. */
function timeoutFor(path: string): number {
  return path.startsWith('/api/score') ? AI_TIMEOUT_MS : DEFAULT_TIMEOUT_MS;
}

async function fetchWithTimeout(path: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutFor(path));
  try {
    return await fetch(`${API_BASE_URL}${path}`, { ...init, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new ApiError('This is taking longer than expected. Please check your connection and try again.', 0, 'TIMEOUT');
    }
    throw new ApiError('Network error — please check your connection and try again.', 0, 'NETWORK');
  } finally {
    clearTimeout(timer);
  }
}

/** GET a JSON endpoint with the caller's Firebase ID token attached. */
export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeader();
  const res = await fetchWithTimeout(path, { headers });
  return handle<T>(res);
}

/** POST JSON to an endpoint with the caller's Firebase ID token attached. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
  const res = await fetchWithTimeout(path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return handle<T>(res);
}

async function handle<T>(res: Response): Promise<T> {
  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    /* non-JSON */
  }
  if (!res.ok) {
    const d = (data ?? {}) as { error?: string; code?: string };
    throw new ApiError(d.error ?? `Request failed (${res.status}).`, res.status, d.code, data);
  }
  return data as T;
}
