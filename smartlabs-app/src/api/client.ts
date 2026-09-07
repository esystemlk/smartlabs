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

/** GET a JSON endpoint with the caller's Firebase ID token attached. */
export async function apiGet<T>(path: string): Promise<T> {
  const headers = await authHeader();
  const res = await fetch(`${API_BASE_URL}${path}`, { headers });
  return handle<T>(res);
}

/** POST JSON to an endpoint with the caller's Firebase ID token attached. */
export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const headers = { ...(await authHeader()), 'Content-Type': 'application/json' };
  const res = await fetch(`${API_BASE_URL}${path}`, {
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
