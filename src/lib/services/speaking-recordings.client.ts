import type { User } from 'firebase/auth';

export async function speakingRequest(user: User, path = '', options: RequestInit = {}) {
  const token = await user.getIdToken();
  const response = await fetch(`/api/speaking-recordings${path}`, { ...options, cache: 'no-store', headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Could not complete your recording request. Please try again.');
  }
  return response;
}
