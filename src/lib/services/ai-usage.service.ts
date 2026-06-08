/**
 * AI Usage Logging Service
 * Logs every AI call to Firestore for admin visibility.
 * All writes are fire-and-forget — never throw into the caller.
 */

export interface AiCallLog {
  userId:     string | null;
  email:      string | null;
  ip:         string | null;
  task:       'essay' | 'swt' | 'server-action';
  keyLabel:   string;          // e.g. 'KEY_1' … 'KEY_5' or 'FIRESTORE_KEY'
  keyIndex:   number | null;   // 1-5 for the env-key pool, null for Firestore key
  model?:     string | null;   // e.g. 'gemini-2.5-flash'
  success:    boolean;
  isRateLimit: boolean;
  error:      string | null;
  timestamp:  Date;
}

let _adminDb: any = null;

async function getDb() {
  if (_adminDb) return _adminDb;
  try {
    const { adminDb } = await import('@/lib/firebase-admin');
    _adminDb = adminDb;
    return _adminDb;
  } catch {
    return null;
  }
}

/** Log a single AI call. Fire-and-forget — never throws. */
export async function logAiCall(log: AiCallLog): Promise<void> {
  try {
    const db = await getDb();
    if (!db) return;

    const dateStr = log.timestamp.toISOString().slice(0, 10); // YYYY-MM-DD

    // 1. Individual call log
    await db.collection('ai_usage_logs').add({
      ...log,
      timestamp: log.timestamp,
    });

    // 2. Daily aggregate per key
    const statsRef = db
      .collection('ai_key_stats')
      .doc(`${log.keyLabel}_${dateStr}`);

    const { FieldValue } = await import('firebase-admin/firestore');

    const increment = (n: number) => FieldValue.increment(n);

    const patch: Record<string, any> = {
      keyLabel:   log.keyLabel,
      keyIndex:   log.keyIndex,
      date:       dateStr,
      requests:   increment(1),
      successes:  increment(log.success ? 1 : 0),
      failures:   increment(log.success ? 0 : 1),
      rateLimitHits: increment(log.isRateLimit ? 1 : 0),
      updatedAt:  log.timestamp,
    };

    // Track per-model breakdown within this key's daily stat
    if (log.model) {
      const mKey = log.model.replace(/[^a-z0-9-]/gi, '_'); // safe Firestore field name
      patch[`models.${mKey}.requests`]  = increment(1);
      patch[`models.${mKey}.successes`] = increment(log.success ? 1 : 0);
      patch[`models.${mKey}.failures`]  = increment(log.success ? 0 : 1);
    }

    try {
      await statsRef.update(patch);
    } catch {
      // Doc doesn't exist yet
      await statsRef.set({
        keyLabel:      log.keyLabel,
        keyIndex:      log.keyIndex,
        date:          dateStr,
        requests:      1,
        successes:     log.success ? 1 : 0,
        failures:      log.success ? 0 : 1,
        rateLimitHits: log.isRateLimit ? 1 : 0,
        updatedAt:     log.timestamp,
      });
    }
  } catch (err) {
    console.warn('[ai-usage] logging failed (non-fatal):', err);
  }
}

/** Returns recent AI call logs for the admin page. */
export async function getRecentAiLogs(limit = 200): Promise<AiCallLog[]> {
  const db = await getDb();
  if (!db) return [];
  const snap = await db
    .collection('ai_usage_logs')
    .orderBy('timestamp', 'desc')
    .limit(limit)
    .get();
  return snap.docs.map((d: any) => {
    const data = d.data();
    return { ...data, timestamp: data.timestamp?.toDate?.() ?? new Date() };
  });
}

/** Returns daily stats for all keys over the last N days. */
export async function getKeyStats(days = 30): Promise<any[]> {
  const db = await getDb();
  if (!db) return [];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().slice(0, 10);

  const snap = await db
    .collection('ai_key_stats')
    .where('date', '>=', sinceStr)
    .orderBy('date', 'desc')
    .get();

  return snap.docs.map((d: any) => d.data());
}
