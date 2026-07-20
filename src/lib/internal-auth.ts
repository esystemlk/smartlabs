import { createHash } from 'crypto';

/**
 * Server-to-server auth for internal calls (the mock exam calling the existing
 * scorers).
 *
 * A mock charges its OWN credit, so when it invokes /api/score-swt etc. those
 * routes must not also deduct a trainer credit. This token proves the call came
 * from our own server rather than a student's browser.
 *
 * The token is derived from a server-only secret that already exists
 * (FIREBASE_ADMIN_CONFIG), so there is no new env var to configure and the
 * value is stable across instances. Set INTERNAL_API_SECRET to override.
 */
export const INTERNAL_HEADER = 'x-internal-token';

export function internalToken(): string | null {
  const src = process.env.INTERNAL_API_SECRET || process.env.FIREBASE_ADMIN_CONFIG;
  if (!src) return null;
  return createHash('sha256').update(src).digest('hex');
}

/** True when the request carries a valid internal token. */
export function isInternalRequest(req: Request): boolean {
  const expected = internalToken();
  if (!expected) return false;
  const got = req.headers.get(INTERNAL_HEADER);
  return !!got && got === expected;
}

/** Headers to attach when calling our own API server-side. */
export function internalHeaders(): Record<string, string> {
  const t = internalToken();
  return t ? { [INTERNAL_HEADER]: t } : {};
}
