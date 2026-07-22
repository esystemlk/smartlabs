/**
 * Site-wide kill switch. The mode lives in Firestore at
 * site_settings/site_mode and is enforced in middleware, so it applies to
 * EVERY route — a visitor cannot slip past it by going straight to
 * /dashboard, /courses or any other link.
 */

export type SiteMode = 'live' | '404' | 'maintenance' | 'updating';

export const SITE_MODES: { id: SiteMode; label: string; description: string }[] = [
  { id: 'live', label: 'Live', description: 'Everything works normally.' },
  { id: '404', label: 'Whole site 404', description: 'Every page shows the 404 animation, as if the site does not exist.' },
  { id: 'maintenance', label: 'Service mode', description: 'Site is temporarily down for service.' },
  { id: 'updating', label: 'Updating', description: 'Site is being updated — back shortly.' },
];

/**
 * Obscure, unguessable path for the developer console. Real protection is the
 * developer-role check (both client and server) — the odd URL is only to keep
 * it out of sight.
 */
export const DEV_CONSOLE_PATH = '/sl-console-9f3k2x';

/** Where middleware rewrites blocked traffic to. */
export const SITE_STATUS_PATH = '/site-status';

/** Cookie that lets the developer browse the real site while a mode is active. */
export const BYPASS_COOKIE = 'sl_dev_bypass';

/** Paths middleware must never block. */
export const ALWAYS_ALLOWED = [
  DEV_CONSOLE_PATH,
  SITE_STATUS_PATH,
  '/api/admin/site-mode',
  // Payment webhooks must ALWAYS run — blocking them would silently lose a
  // student's purchase while the site is in a mode.
  '/api/payhere',
];

export const SITE_MODE_DOC = { collection: 'site_settings', doc: 'site_mode' };

export interface SiteModeState {
  mode: SiteMode;
  message?: string;
  /**
   * SHA-256 of the bypass token — never the token itself.
   *
   * site_settings is world-readable (middleware reads it unauthenticated, from
   * the edge, using the public web API key), so anything stored here is public.
   * Publishing the plain token let any visitor lift it and walk straight past
   * a 404/maintenance mode. The raw token only ever exists in the httpOnly
   * cookie handed to the developer.
   */
  bypassTokenHash?: string;
  updatedBy?: string;
  updatedAt?: unknown;
}

/**
 * SHA-256 → lowercase hex, via Web Crypto so the exact same function works in
 * the edge middleware and in the Node route handler.
 */
export async function hashBypassToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/** Length-safe, non-short-circuiting comparison for the hash check. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
