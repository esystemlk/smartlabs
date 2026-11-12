// IELTS Studio: the same app served on its own domain(s). Hosts come from
// NEXT_PUBLIC_IELTS_STUDIO_HOSTS (comma-separated, e.g. "ieltsstudio.lk,www.ieltsstudio.lk").
// Default "studio.localhost" lets it be tested locally at http://studio.localhost:9002.
export const STUDIO_HOSTS = (process.env.NEXT_PUBLIC_IELTS_STUDIO_HOSTS || 'studio.localhost')
  .split(',').map(h => h.trim().toLowerCase()).filter(Boolean);

// IELTS Studio deploys as its own Vercel project from this same repo. That project sets
// NEXT_PUBLIC_IELTS_STUDIO_MODE=1 so every address it serves (custom domain and *.vercel.app
// previews) is Studio. The main Smart Labs project leaves it unset.
export const STUDIO_ONLY = process.env.NEXT_PUBLIC_IELTS_STUDIO_MODE === '1';

/** True when this request/page belongs to IELTS Studio (Studio-only deployment, or a Studio host). */
export const isStudioHost = (host: string | null | undefined) =>
  STUDIO_ONLY || (!!host && STUDIO_HOSTS.includes(host.split(':')[0].toLowerCase()));

/** Paths the Studio domain serves as-is: its own pages, the shared IELTS practice/mock pages, and APIs. */
export const STUDIO_ALLOWED_PREFIXES = ['/studio', '/dashboard/ielts', '/ai-ielts-essay-practice', '/api', '/payment', '/payment-success', '/payment-cancel', '/site-status'];

/** Where Studio sends the Smart Labs addresses people (and old links) commonly use. */
export const STUDIO_REDIRECTS: Record<string, string> = {
  '/': '/studio',
  '/login': '/studio/login',
  '/signup': '/studio/signup',
  '/forgot-password': '/studio/forgot-password',
  '/dashboard': '/studio',
};

/** Only same-site relative paths may be used as a post-login redirect (blocks open redirects). */
export const safeRedirect = (value: string | null | undefined, fallback = '/studio') =>
  value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\') ? value : fallback;
