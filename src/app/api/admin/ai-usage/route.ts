import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getRecentAiLogs, getKeyStats } from '@/lib/services/ai-usage.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ROLES = new Set(['admin', 'developer']);

async function verifyAdmin(authHeader: string | null): Promise<{ ok: true; uid: string } | { ok: false; status: number; error: string }> {
  if (!authHeader?.startsWith('Bearer ')) return { ok: false, status: 401, error: 'Unauthorized' };
  try {
    const decoded = await adminAuth!.verifyIdToken(authHeader.slice(7));
    const snap = await adminDb!.collection('users').doc(decoded.uid).get();
    const role = (snap.data()?.role as string) ?? 'student';
    if (!ALLOWED_ROLES.has(role) && decoded.email !== 'thimira.vishwa2003@gmail.com') {
      return { ok: false, status: 403, error: 'Forbidden' };
    }
    return { ok: true, uid: decoded.uid };
  } catch {
    return { ok: false, status: 401, error: 'Invalid token' };
  }
}

export async function GET(request: Request) {
  if (!adminDb || !adminAuth) return NextResponse.json({ error: 'Server not configured' }, { status: 500 });

  const auth = await verifyAdmin(request.headers.get('Authorization'));
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });

  const url = new URL(request.url);
  const days = Math.min(90, parseInt(url.searchParams.get('days') ?? '30', 10));
  const limit = Math.min(500, parseInt(url.searchParams.get('limit') ?? '200', 10));

  const [logs, keyStats] = await Promise.all([
    getRecentAiLogs(limit),
    getKeyStats(days),
  ]);

  // Build per-user summary from logs
  const userMap = new Map<string, { email: string; userId: string | null; ips: Set<string>; essay: number; swt: number; serverAction: number; errors: number; lastSeen: Date }>();
  for (const log of logs) {
    const key = log.email ?? log.userId ?? 'unknown';
    if (!userMap.has(key)) {
      userMap.set(key, { email: log.email ?? key, userId: log.userId ?? null, ips: new Set(), essay: 0, swt: 0, serverAction: 0, errors: 0, lastSeen: log.timestamp });
    }
    const u = userMap.get(key)!;
    if (!u.userId && log.userId) u.userId = log.userId; // backfill uid if a later log has it
    if (log.ip) u.ips.add(log.ip);
    if (log.task === 'essay') u.essay++;
    else if (log.task === 'swt') u.swt++;
    else u.serverAction++;
    if (!log.success) u.errors++;
    if (log.timestamp > u.lastSeen) u.lastSeen = log.timestamp;
  }

  // ─── Enrich with name + credit balances from the users collection ───────────
  // Free-tier limits (kept in sync with the score-essay / score-swt routes)
  const FREE_ESSAY_LIMIT = 2;
  const FREE_SWT_LIMIT = 2;
  const now = new Date();

  // Resolve each summary's user doc. Prefer the logged uid; fall back to an
  // email lookup so legacy logs without a userId still get credit info.
  const entries = Array.from(userMap.values());
  const userDocs = await Promise.all(entries.map(async (u) => {
    try {
      if (u.userId) {
        const snap = await adminDb!.collection('users').doc(u.userId).get();
        if (snap.exists) return snap.data() ?? {};
      }
      const email = u.email && u.email.includes('@') ? u.email : null;
      if (email) {
        const q = await adminDb!.collection('users').where('email', '==', email).limit(1).get();
        if (!q.empty) return q.docs[0].data() ?? {};
      }
    } catch { /* non-fatal — fall through to nulls */ }
    return null as Record<string, any> | null;
  }));

  const toDate = (v: any): Date | null => v?.toDate?.() ?? null;

  const userSummary = entries.map((u, i) => {
    const d = userDocs[i];
    const essayMonthly = toDate(d?.essayMonthlyExpiry);
    const swtMonthly = toDate(d?.swtMonthlyExpiry);
    const credits = d ? {
      name: (d.displayName as string) ?? (d.name as string) ?? '',
      essay: {
        free: Math.max(0, FREE_ESSAY_LIMIT - ((d.essayFreeUsed as number) ?? 0)),
        paid: (d.essayPaidCredits as number) ?? 0,
        gen: (d.essayGenCredits as number) ?? 0,
        monthlyActive: !!(essayMonthly && essayMonthly > now),
      },
      swt: {
        free: Math.max(0, FREE_SWT_LIMIT - ((d.swtFreeUsed as number) ?? 0)),
        paid: (d.swtPaidCredits as number) ?? 0,
        monthlyActive: !!(swtMonthly && swtMonthly > now),
      },
    } : null;
    return {
      email: u.email,
      name: credits?.name ?? '',
      ips: Array.from(u.ips),
      essay: u.essay,
      swt: u.swt,
      serverAction: u.serverAction,
      errors: u.errors,
      lastSeen: u.lastSeen,
      total: u.essay + u.swt + u.serverAction,
      credits,
    };
  }).sort((a, b) => b.total - a.total);

  // Build per-key summary (daily → weekly → monthly)
  const keyLabelSet = new Set(keyStats.map((s: any) => s.keyLabel));
  const today = new Date();
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const monthAgo = new Date(today); monthAgo.setDate(today.getDate() - 30);

  const keySummary = Array.from(keyLabelSet).map(label => {
    const rows = keyStats.filter((s: any) => s.keyLabel === label);
    const sum = (filter: (d: Date) => boolean) => rows
      .filter((r: any) => filter(new Date(r.date)))
      .reduce((acc: any, r: any) => ({
        requests: acc.requests + (r.requests ?? 0),
        successes: acc.successes + (r.successes ?? 0),
        failures: acc.failures + (r.failures ?? 0),
        rateLimitHits: acc.rateLimitHits + (r.rateLimitHits ?? 0),
      }), { requests: 0, successes: 0, failures: 0, rateLimitHits: 0 });

    return {
      keyLabel: label,
      keyIndex: rows[0]?.keyIndex ?? null,
      daily:   sum(d => d.toISOString().slice(0, 10) === today.toISOString().slice(0, 10)),
      weekly:  sum(d => d >= weekAgo),
      monthly: sum(d => d >= monthAgo),
      hasRateLimitAlert: rows.some((r: any) => (r.rateLimitHits ?? 0) > 0),
    };
  }).sort((a, b) => (a.keyIndex ?? 99) - (b.keyIndex ?? 99));

  // Build per-model summary from logs
  const modelMap = new Map<string, { requests: number; successes: number; failures: number; lastUsed: Date | null }>();
  for (const log of logs) {
    const modelName = (log as any).model as string | null | undefined;
    if (!modelName) continue;
    if (!modelMap.has(modelName)) modelMap.set(modelName, { requests: 0, successes: 0, failures: 0, lastUsed: null });
    const m = modelMap.get(modelName)!;
    m.requests++;
    if (log.success) m.successes++; else m.failures++;
    if (!m.lastUsed || log.timestamp > m.lastUsed) m.lastUsed = log.timestamp;
  }
  const modelSummary = Array.from(modelMap.entries())
    .map(([name, s]) => ({ name, ...s, lastUsed: s.lastUsed }))
    .sort((a, b) => b.requests - a.requests);

  // Recent error log
  const errorLog = logs
    .filter(l => !l.success)
    .slice(0, 100)
    .map(l => ({
      email: l.email,
      ip: l.ip,
      task: l.task,
      keyLabel: l.keyLabel,
      model: (l as any).model ?? null,
      isRateLimit: l.isRateLimit,
      error: l.error,
      timestamp: l.timestamp,
    }));

  return NextResponse.json({
    userSummary,
    keySummary,
    modelSummary,
    errorLog,
    recentLogs: logs.slice(0, 100).map(l => ({
      email: l.email,
      ip: l.ip,
      task: l.task,
      keyLabel: l.keyLabel,
      model: (l as any).model ?? null,
      success: l.success,
      isRateLimit: l.isRateLimit,
      error: l.error,
      timestamp: l.timestamp,
    })),
    meta: { totalLogs: logs.length, days },
  });
}
