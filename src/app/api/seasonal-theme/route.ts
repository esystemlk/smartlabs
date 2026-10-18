import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { readTheme, themeRefs } from '@/lib/seasonal-theme/server';
import { defaultTheme } from '@/lib/seasonal-theme/config';

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  const response = (body: object, status = 200) => NextResponse.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
  try {
    if (!adminDb) return response({ config: defaultTheme, serverNow: Date.now(), version: 'off' });
    if (request.nextUrl.searchParams.get('preview') === '1') {
      const cookie = request.cookies.get('sl-seasonal-preview')?.value;
      if (!cookie || !adminAuth) return response({ error: 'Preview session expired.' }, 401);
      const identity = await adminAuth.verifySessionCookie(cookie, true);
      const user = await adminDb.collection('users').doc(identity.uid).get();
      if (!['admin', 'developer'].includes(user.data()?.role)) return response({ error: 'Administrator access required.' }, 403);
      const session = await adminDb.collection('seasonalThemePreviews').doc(identity.uid).get();
      if (!session.exists || session.data()!.expiresAt < Date.now()) return response({ error: 'Preview session expired.' }, 401);
      return response({ config: readTheme(session.data()!.config), serverNow: Date.now(), version: 'preview', preview: true });
    }
    const snap = await themeRefs().runtime.get();
    return response({ config: readTheme(snap.data()?.config), version: snap.data()?.version ?? 'off', serverNow: Date.now() });
  } catch {
    return response({ config: defaultTheme, serverNow: Date.now(), version: 'unavailable' });
  }
}
