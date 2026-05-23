import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

// ─── Developer email — THE single source of truth ────────────────────────────
// Access is granted purely by verified Firebase ID token + matching this email.
// No Firestore role check is required; the role is healed in the background.
const DEVELOPER_EMAIL = 'thimira.vishwa2003@gmail.com';

interface DeveloperContext {
  uid: string;
  email: string;
}

async function verifyDeveloper(request: Request): Promise<DeveloperContext | null> {
  // 1. Extract Bearer token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    console.warn('[ai-config] Missing or malformed Authorization header');
    return null;
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    console.warn('[ai-config] Empty ID token');
    return null;
  }

  // 2. Verify Firebase ID token — REQUIRED (proves identity)
  if (!adminAuth) {
    console.error('[ai-config] Firebase Admin Auth is not initialised — check FIREBASE_ADMIN_CONFIG env var');
    return null;
  }

  let decoded: { uid: string; email?: string };
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    console.error('[ai-config] ID token verification failed:', err);
    return null;
  }

  // 3. Email check — the primary and ONLY gate
  const email = (decoded.email || '').toLowerCase().trim();
  if (email !== DEVELOPER_EMAIL) {
    console.warn(`[ai-config] Access denied for email: ${email}`);
    return null;
  }

  // 4. Best-effort: ensure Firestore role is 'developer' (fire-and-forget)
  if (adminDb) {
    adminDb.collection('users').doc(decoded.uid)
      .update({ role: 'developer' })
      .catch(err => console.warn('[ai-config] Role heal failed (non-blocking):', err));
  }

  console.log(`[ai-config] ✓ Access granted for ${email}`);
  return { uid: decoded.uid, email };
}

// ─── GET — return current AI config & model usage ────────────────────────────
export async function GET(request: Request) {
  const dev = await verifyDeveloper(request);
  if (!dev) {
    return NextResponse.json(
      { error: 'Unauthorized. Developer access required.' },
      { status: 403 }
    );
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  try {
    const [aiSettingsSnap, usageSnap] = await Promise.all([
      adminDb.collection('system_config').doc('ai_settings').get(),
      adminDb.collection('system_config').doc('model_usage').get(),
    ]);

    const aiSettings = aiSettingsSnap.exists ? aiSettingsSnap.data()! : {};
    const usage      = usageSnap.exists       ? usageSnap.data()!       : {};

    // Mask the stored key
    const rawKey   = (aiSettings.geminiApiKey as string) || '';
    const maskedKey = rawKey.length > 12
      ? `${rawKey.slice(0, 8)}${'•'.repeat(Math.min(rawKey.length - 12, 20))}${rawKey.slice(-4)}`
      : rawKey
      ? '•••• masked ••••'
      : '(none — falling back to .env)';

    // Convert Firestore Timestamps to ISO strings for JSON serialisation
    const serializeHistory = (arr: any[]) =>
      (arr || []).slice(-10).reverse().map((h: any) => ({
        ...h,
        changedAt: h.changedAt?.toDate?.()?.toISOString?.() ?? h.changedAt,
      }));

    const serializeModelStats = (models: Record<string, any>) => {
      const out: Record<string, any> = {};
      for (const [name, data] of Object.entries(models || {})) {
        out[name] = {
          ...data,
          lastUsedAt: (data as any).lastUsedAt?.toDate?.()?.toISOString?.() ?? (data as any).lastUsedAt,
        };
      }
      return out;
    };

    return NextResponse.json({
      maskedKey,
      keySource      : rawKey ? 'firestore' : 'env',
      activeModels   : aiSettings.activeModels   ?? ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash'],
      lastUpdatedAt  : aiSettings.lastUpdatedAt?.toDate?.()?.toISOString?.() ?? null,
      lastUpdatedBy  : aiSettings.lastUpdatedBy  ?? null,
      keyHistory     : serializeHistory(aiSettings.keyHistory ?? []),
      modelStats     : serializeModelStats(usage.models ?? {}),
      totalRequests  : usage.totalRequests ?? 0,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// ─── POST — save a new API key ────────────────────────────────────────────────
export async function POST(request: Request) {
  const dev = await verifyDeveloper(request);
  if (!dev) {
    return NextResponse.json(
      { error: 'Unauthorized. Developer access required.' },
      { status: 403 }
    );
  }

  if (!adminDb) {
    return NextResponse.json({ error: 'Database unavailable.' }, { status: 500 });
  }

  let body: { apiKey?: string; confirmApiKey?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const { apiKey = '', confirmApiKey = '', reason = '' } = body;

  // ── Validation ──────────────────────────────────────────────────────────────
  if (!apiKey || !confirmApiKey) {
    return NextResponse.json(
      { error: 'Both API key fields are required.' },
      { status: 400 }
    );
  }
  if (apiKey !== confirmApiKey) {
    return NextResponse.json(
      { error: 'The two API keys do not match. Please re-enter.' },
      { status: 400 }
    );
  }
  if (!apiKey.startsWith('AIza') || apiKey.length < 35) {
    return NextResponse.json(
      { error: 'Invalid key format. Gemini API keys start with "AIza" and are 39 characters.' },
      { status: 400 }
    );
  }

  try {
    const now       = new Date();
    const maskedKey = `${apiKey.slice(0, 8)}${'•'.repeat(27)}${apiKey.slice(-4)}`;

    // Read existing history
    const existingSnap = await adminDb.collection('system_config').doc('ai_settings').get();
    const existingHistory: unknown[] = existingSnap.exists
      ? (existingSnap.data()?.keyHistory ?? [])
      : [];

    const historyEntry = {
      changedAt  : now,
      changedBy  : dev.email,
      maskedKey,
      reason     : reason.trim() || 'Manual update by developer',
    };

    await adminDb.collection('system_config').doc('ai_settings').set(
      {
        geminiApiKey  : apiKey,
        activeModels  : ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-3.1-pro'],
        lastUpdatedAt : now,
        lastUpdatedBy : dev.email,
        keyHistory    : [...existingHistory, historyEntry].slice(-25),
      },
      { merge: true }
    );

    // Signal score-essay route to invalidate its in-memory cache
    await adminDb.collection('system_config').doc('cache_control').set(
      { keyVersion: now.getTime() },
      { merge: true }
    );

    return NextResponse.json({
      success   : true,
      maskedKey,
      message   : 'API key updated successfully. Active within 2 minutes.',
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
