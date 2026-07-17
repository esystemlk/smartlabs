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
  /** Random token; the matching cookie value bypasses the block. */
  bypassToken?: string;
  updatedBy?: string;
  updatedAt?: unknown;
}
