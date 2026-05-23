import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

const DEVELOPER_EMAIL = 'thimira.vishwa2003@gmail.com';

async function verifyDeveloper(request: Request): Promise<boolean> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[verify-key] Missing Authorization header');
    return false;
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return false;

  if (!adminAuth) {
    console.error('[verify-key] Firebase Admin Auth not initialised');
    return false;
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    console.error('[verify-key] ID token verification failed:', err);
    return false;
  }

  const email = (decoded.email || '').toLowerCase().trim();
  if (email !== DEVELOPER_EMAIL) {
    console.warn(`[verify-key] Access denied for: ${email}`);
    return false;
  }

  // Best-effort role heal (fire-and-forget)
  if (adminDb) {
    adminDb.collection('users').doc(decoded.uid)
      .update({ role: 'developer' })
      .catch(() => {});
  }

  console.log(`[verify-key] ✓ Access granted for ${email}`);
  return true;
}

// ─── POST — test whether a provided API key actually works ───────────────────
export async function POST(request: Request) {
  const isDev = await verifyDeveloper(request);
  if (!isDev) {
    return NextResponse.json(
      { error: 'Unauthorized. Developer access required.' },
      { status: 403 }
    );
  }

  let body: { apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { apiKey = '' } = body;
  if (!apiKey) {
    return NextResponse.json({ valid: false, error: 'API key is required.' }, { status: 400 });
  }

  // Quick format sanity check before hitting the API
  if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
    return NextResponse.json({
      valid  : false,
      error  : 'Key format invalid — Gemini keys start with "AIza" and are 39 characters.',
    });
  }

  // Send a minimal request to Gemini to check if the key works
  try {
    const testUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const testRes = await fetch(testUrl, {
      method  : 'POST',
      headers : { 'Content-Type': 'application/json' },
      body    : JSON.stringify({
        contents        : [{ role: 'user', parts: [{ text: 'Reply with exactly one word: OK' }] }],
        generationConfig: { maxOutputTokens: 5, temperature: 0 },
      }),
    });

    if (!testRes.ok) {
      let apiError = `HTTP ${testRes.status}`;
      try {
        const errData = await testRes.json();
        apiError = errData?.error?.message || apiError;
      } catch { /* ignore parse error */ }

      return NextResponse.json({ valid: false, error: apiError });
    }

    const data = await testRes.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    if (!text) {
      return NextResponse.json({ valid: false, error: 'Key returned empty response. Might be restricted.' });
    }

    return NextResponse.json({
      valid  : true,
      message: 'API key verified and working ✓',
      model  : 'gemini-2.0-flash',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ valid: false, error: message });
  }
}
