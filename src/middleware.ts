import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { firebaseConfig } from '@/firebase/config';
import {
  ALWAYS_ALLOWED,
  BYPASS_COOKIE,
  SITE_STATUS_PATH,
  SITE_MODE_DOC,
  hashBypassToken,
  safeEqual,
  type SiteMode,
} from '@/lib/site-mode';

/**
 * Enforces the site-wide mode. Runs on the edge for every page and API
 * request, so no link (/dashboard, /courses, a deep link) can slip past it.
 *
 * The mode doc is world-readable (site_settings rules), so the edge can read
 * it over Firestore's REST API without credentials.
 */

const FIRESTORE_URL =
  `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}` +
  `/databases/(default)/documents/${SITE_MODE_DOC.collection}/${SITE_MODE_DOC.doc}` +
  `?key=${firebaseConfig.apiKey}`;

// Short-lived cache: avoids hitting Firestore on every request while still
// letting a mode change take effect within seconds.
const CACHE_TTL_MS = 10_000;
let cache: { at: number; state: { mode: SiteMode; bypassTokenHash?: string } } | null = null;

async function readMode(): Promise<{ mode: SiteMode; bypassTokenHash?: string }> {
  if (cache && Date.now() - cache.at < CACHE_TTL_MS) return cache.state;

  let state: { mode: SiteMode; bypassTokenHash?: string } = { mode: 'live' };
  try {
    const res = await fetch(FIRESTORE_URL, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      const f = json?.fields ?? {};
      state = {
        mode: (f.mode?.stringValue as SiteMode) ?? 'live',
        // Only the hash is published — see hashBypassToken in lib/site-mode.
        bypassTokenHash: f.bypassTokenHash?.stringValue,
      };
    }
    // A 404 (doc never created) correctly falls through to 'live'.
  } catch {
    // Never take the site down because the mode lookup itself failed.
    state = { mode: 'live' };
  }

  cache = { at: Date.now(), state };
  return state;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (ALWAYS_ALLOWED.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  const { mode, bypassTokenHash } = await readMode();
  if (mode === 'live') return NextResponse.next();

  // Developer preview: the cookie holds the raw token, Firestore holds only
  // its hash, so a visitor reading the public doc still cannot forge one.
  const cookie = req.cookies.get(BYPASS_COOKIE)?.value;
  if (bypassTokenHash && cookie && safeEqual(await hashBypassToken(cookie), bypassTokenHash)) {
    return NextResponse.next();
  }

  const url = req.nextUrl.clone();
  url.pathname = SITE_STATUS_PATH;
  url.search = `mode=${mode}`;

  const res = NextResponse.rewrite(url);
  res.headers.set('x-site-mode', mode);
  res.headers.set('Cache-Control', 'no-store');
  if (mode !== '404') res.headers.set('Retry-After', '3600');
  return res;
}

export const config = {
  // Everything except Next internals and static files.
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpe?g|gif|svg|webp|ico|mp4|webm|woff2?|ttf|txt|xml|json)$).*)',
  ],
};
