import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const STAFF = new Set(['admin', 'developer']);
const MODEL = 'gemini-flash-latest'; // the model the live scorers use

// Ping one Gemini key with a tiny prompt; returns ok + latency, never throws.
async function ping(key: string): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const started = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      // Flash is a thinking model — give enough output budget that thinking tokens
      // don't starve the actual reply and make a working key look empty/failed.
      body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'Reply with exactly one word: OK' }] }], generationConfig: { maxOutputTokens: 256, temperature: 0 } }),
    });
    const latencyMs = Date.now() - started;
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { msg = (await res.json())?.error?.message || msg; } catch { /* ignore */ }
      return { ok: false, latencyMs, error: msg };
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    return text ? { ok: true, latencyMs } : { ok: false, latencyMs, error: 'Empty response (key may be restricted).' };
  } catch (e) {
    return { ok: false, latencyMs: Date.now() - started, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(request: Request) {
  try {
    if (!adminAuth || !adminDb) return NextResponse.json({ error: 'Server not configured.' }, { status: 500 });
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    let uid: string;
    try { uid = (await adminAuth.verifyIdToken(authHeader.slice(7))).uid; }
    catch { return NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 }); }
    const role = (await adminDb.collection('users').doc(uid).get()).data()?.role as string | undefined;
    if (!STAFF.has(role ?? '')) return NextResponse.json({ error: 'Developer/admin access required.' }, { status: 403 });

    // Per-key health — the practice pool (KEY_1..5) that the app rotates through,
    // plus the dedicated full-mock key (KEY_6) used only by mock scoring.
    const poolSlots = [1, 2, 3, 4, 5].map(i => ({ label: `KEY_${i}`, key: process.env[`GOOGLE_GENAI_API_KEY_${i}`] ?? '' }));
    const slots = [...poolSlots, { label: 'KEY_6 (mock)', key: process.env.GOOGLE_GENAI_API_KEY_6 ?? '' }];
    const present = poolSlots.filter(s => s.key); // load burst rotates the practice pool only
    const keys = await Promise.all(slots.map(async (s) => {
      if (!s.key) return { label: s.label, present: false as const };
      const r = await ping(s.key);
      return { label: s.label, present: true as const, model: MODEL, ...r };
    }));

    // Load check: fire a burst of parallel pings (rotating keys, like production
    // under many simultaneous students) and report how many came back OK.
    let load: { attempted: number; succeeded: number; avgLatencyMs: number } | null = null;
    if (present.length) {
      const BURST = 8;
      const results = await Promise.all(Array.from({ length: BURST }, (_, i) => ping(present[i % present.length].key)));
      const okResults = results.filter(r => r.ok);
      load = {
        attempted: BURST,
        succeeded: okResults.length,
        avgLatencyMs: okResults.length ? Math.round(okResults.reduce((a, r) => a + r.latencyMs, 0) / okResults.length) : 0,
      };
    }

    const workingKeys = keys.filter(k => k.present && k.ok).length;
    return NextResponse.json({
      checkedAt: new Date().toISOString(),
      model: MODEL,
      configuredKeys: slots.filter(s => s.key).length,
      workingKeys,
      healthy: workingKeys > 0,
      keys,
      load,
    });
  } catch (error) {
    console.error('[admin/ai-health]', error);
    return NextResponse.json({ error: 'Health check failed.' }, { status: 500 });
  }
}
