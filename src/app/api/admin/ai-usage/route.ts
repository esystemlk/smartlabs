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
  const userMap = new Map<string, { email: string; ips: Set<string>; essay: number; swt: number; serverAction: number; errors: number; lastSeen: Date }>();
  for (const log of logs) {
    const key = log.email ?? log.userId ?? 'unknown';
    if (!userMap.has(key)) {
      userMap.set(key, { email: log.email ?? key, ips: new Set(), essay: 0, swt: 0, serverAction: 0, errors: 0, lastSeen: log.timestamp });
    }
    const u = userMap.get(key)!;
    if (log.ip) u.ips.add(log.ip);
    if (log.task === 'essay') u.essay++;
    else if (log.task === 'swt') u.swt++;
    else u.serverAction++;
    if (!log.success) u.errors++;
    if (log.timestamp > u.lastSeen) u.lastSeen = log.timestamp;
  }

  const userSummary = Array.from(userMap.entries()).map(([, u]) => ({
    email: u.email,
    ips: Array.from(u.ips),
    essay: u.essay,
    swt: u.swt,
    serverAction: u.serverAction,
    errors: u.errors,
    lastSeen: u.lastSeen,
    total: u.essay + u.swt + u.serverAction,
  })).sort((a, b) => b.total - a.total);

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
