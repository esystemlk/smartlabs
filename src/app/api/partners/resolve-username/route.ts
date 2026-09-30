import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Resolve a partner username to the email address used for sign-in. Partner
 * login accepts a username OR an email; the client calls this only when the
 * entered value is not an email. Returns a neutral 404 when not found.
 */
export async function POST(request: Request) {
  try {
    if (!adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const { username } = (await request.json()) as { username?: string };
    const u = (username ?? '').trim().toLowerCase();
    if (!u) return NextResponse.json({ error: 'Username required.' }, { status: 400 });

    const snap = await adminDb.collection('partner_usernames').doc(u).get();
    if (!snap.exists) return NextResponse.json({ error: 'No account found.' }, { status: 404 });
    const uid = snap.data()?.uid as string | undefined;
    if (!uid) return NextResponse.json({ error: 'No account found.' }, { status: 404 });

    const p = await adminDb.collection('partners').doc(uid).get();
    const email = p.data()?.email as string | undefined;
    if (!email) return NextResponse.json({ error: 'No account found.' }, { status: 404 });

    return NextResponse.json({ email });
  } catch {
    return NextResponse.json({ error: 'Could not resolve username.' }, { status: 500 });
  }
}
