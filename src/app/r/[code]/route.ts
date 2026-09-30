import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Partner referral link: /r/{code}
 * Validates the code, drops a first-party attribution cookie, and forwards the
 * visitor to the site. An inactive/unknown code just forwards with no cookie.
 * (Turning the cookie into an attributed referral on enquiry is the next step.)
 */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const origin = new URL(request.url).origin;
  const home = NextResponse.redirect(`${origin}/?ref=${encodeURIComponent(code)}`);

  try {
    if (!adminDb || !code) return home;
    const snap = await adminDb.collection('partner_codes').doc(code).get();
    const data = snap.data() as { active?: boolean } | undefined;
    if (!snap.exists || data?.active === false) {
      // Unknown or paused code — forward without attributing.
      return NextResponse.redirect(`${origin}/`);
    }
    const res = NextResponse.redirect(`${origin}/`);
    res.cookies.set('ref_code', code, {
      maxAge: 60 * 60 * 24 * 90, // 90 days
      httpOnly: false, sameSite: 'lax', path: '/',
    });
    return res;
  } catch {
    return home;
  }
}
