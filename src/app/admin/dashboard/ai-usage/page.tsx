'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import {
  ChevronLeft, RefreshCw, Loader2, Activity, Users, Key, AlertTriangle,
  CheckCircle2, XCircle, Clock, Search, Lock, ShieldAlert,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface PeriodStats { requests: number; successes: number; failures: number; rateLimitHits: number }
interface KeySummary {
  keyLabel: string; keyIndex: number | null;
  daily: PeriodStats; weekly: PeriodStats; monthly: PeriodStats;
  hasRateLimitAlert: boolean;
}
interface UserSummary {
  email: string; ips: string[]; essay: number; swt: number;
  serverAction: number; errors: number; lastSeen: string; total: number;
}
interface LogEntry {
  email: string | null; ip: string | null; task: string;
  keyLabel: string; success: boolean; isRateLimit: boolean;
  error: string | null; timestamp: string;
}
interface ApiData {
  userSummary: UserSummary[];
  keySummary: KeySummary[];
  errorLog: LogEntry[];
  recentLogs: LogEntry[];
  meta: { totalLogs: number; days: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (iso: string | null) => iso
  ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
  : '—';

const taskColor: Record<string, string> = {
  essay: 'bg-purple-100 text-purple-700',
  swt:   'bg-blue-100 text-blue-700',
  'server-action': 'bg-slate-100 text-slate-700',
};

function StatBox({ label, value, sub, color = '' }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg bg-background border text-center min-w-[70px]">
      <span className={`text-xl font-black ${color}`}>{value}</span>
      <span className="text-[10px] text-muted-foreground leading-tight">{label}</span>
      {sub && <span className="text-[10px] text-red-500 font-semibold">{sub}</span>}
    </div>
  );
}

function PeriodRow({ label, s }: { label: string; s: PeriodStats }) {
  const rate = s.requests ? Math.round((s.successes / s.requests) * 100) : null;
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-16 text-muted-foreground shrink-0 font-medium">{label}</span>
      <div className="flex gap-1 flex-wrap">
        <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono">{s.requests} req</span>
        <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 font-mono">{s.successes} ok</span>
        {s.failures > 0 && <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-mono">{s.failures} fail</span>}
        {s.rateLimitHits > 0 && <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 font-mono">{s.rateLimitHits} RL</span>}
        {rate !== null && <span className={`px-1.5 py-0.5 rounded font-bold ${rate >= 90 ? 'bg-emerald-100 text-emerald-700' : rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{rate}%</span>}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AiUsagePage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  const [data, setData] = useState<ApiData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'users' | 'keys' | 'log' | 'errors'>('users');

  const load = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/ai-usage?days=30&limit=300', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 403 || res.status === 401) { setAccessDenied(true); return; }
      if (!res.ok) throw new Error('Failed to load');
      setData(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!isUserLoading && !user) { router.push('/login'); return; }
    if (!isUserLoading && user) load();
  }, [user, isUserLoading, router, load]);

  if (isUserLoading || (!data && !accessDenied && isLoading)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm">Loading AI usage data…</p>
        </div>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Card className="max-w-md w-full mx-4 border-red-200 bg-red-50">
          <CardHeader className="text-center">
            <Lock className="h-12 w-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700">Access Denied</CardTitle>
            <CardDescription className="text-red-600">Admin or Developer role required.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline"><Link href="/admin/dashboard"><ChevronLeft className="h-4 w-4 mr-2" />Back</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rateLimitKeys = data?.keySummary.filter(k => k.hasRateLimitAlert) ?? [];
  const totalErrors   = data?.errorLog.length ?? 0;
  const totalRequests = data?.keySummary.reduce((s, k) => s + k.monthly.requests, 0) ?? 0;

  const filteredUsers = (data?.userSummary ?? []).filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.ips.some(ip => ip.includes(search))
  );
  const filteredLogs = (data?.recentLogs ?? []).filter(l =>
    !search || (l.email ?? '').toLowerCase().includes(search.toLowerCase()) || (l.ip ?? '').includes(search)
  );

  const tabs = [
    { key: 'users',  label: 'Users',    icon: Users,    badge: data?.userSummary.length },
    { key: 'keys',   label: 'API Keys', icon: Key,      badge: data?.keySummary.length },
    { key: 'log',    label: 'Activity', icon: Activity, badge: data?.meta.totalLogs },
    { key: 'errors', label: 'Errors',   icon: AlertTriangle, badge: totalErrors, badgeRed: totalErrors > 0 },
  ] as const;

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-7xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm"><Link href="/admin/dashboard"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link></Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <Activity className="h-7 w-7 text-primary" />
                  AI Usage Tracker
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Per-user, per-IP and per-key usage — last 30 days ({data?.meta.totalLogs ?? 0} events)
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={load} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />Refresh
            </Button>
          </div>

          {/* Alert banners */}
          {rateLimitKeys.length > 0 && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-orange-50 border border-orange-300 text-orange-800">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Rate limit hits detected</p>
                <p className="text-xs mt-0.5">
                  Keys with recent rate-limit errors: {rateLimitKeys.map(k => k.keyLabel).join(', ')}.
                  Consider adding more API keys or spreading usage.
                </p>
              </div>
            </div>
          )}

          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl font-black">{totalRequests}</div>
                <p className="text-xs text-muted-foreground mt-1">Total AI calls (30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl font-black">{data?.userSummary.length ?? 0}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className={`text-3xl font-black ${totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{totalErrors}</div>
                <p className="text-xs text-muted-foreground mt-1">Total errors</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className={`text-3xl font-black ${rateLimitKeys.length > 0 ? 'text-orange-600' : 'text-emerald-600'}`}>{rateLimitKeys.length}</div>
                <p className="text-xs text-muted-foreground mt-1">Keys with rate limits</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {tabs.map(t => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeTab === t.key
                    ? 'bg-primary text-primary-foreground shadow'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
                {t.badge !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    'badgeRed' in t && t.badgeRed
                      ? 'bg-red-500 text-white'
                      : activeTab === t.key ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-background text-foreground'
                  }`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* Search */}
          {(activeTab === 'users' || activeTab === 'log') && (
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search email or IP…"
                className="pl-9"
              />
            </div>
          )}

          {/* ── TAB: Users ── */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Per-User AI Usage</CardTitle>
                <CardDescription>Sorted by total calls (last 30 days)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                        <th className="pb-2 pr-4 font-semibold">Email</th>
                        <th className="pb-2 pr-4 font-semibold">IP Address(es)</th>
                        <th className="pb-2 pr-2 font-semibold text-center">Essay</th>
                        <th className="pb-2 pr-2 font-semibold text-center">SWT</th>
                        <th className="pb-2 pr-2 font-semibold text-center">Other</th>
                        <th className="pb-2 pr-2 font-semibold text-center">Total</th>
                        <th className="pb-2 pr-2 font-semibold text-center">Errors</th>
                        <th className="pb-2 font-semibold">Last Seen</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredUsers.map((u, i) => (
                        <tr key={i} className="hover:bg-muted/30 transition-colors">
                          <td className="py-2.5 pr-4 font-medium text-xs">{u.email}</td>
                          <td className="py-2.5 pr-4 text-xs text-muted-foreground">
                            {u.ips.length === 0 ? '—' : u.ips.map((ip, j) => (
                              <span key={j} className="inline-block font-mono bg-slate-100 rounded px-1 mr-1 mb-0.5 text-[10px]">{ip}</span>
                            ))}
                          </td>
                          <td className="py-2.5 pr-2 text-center">
                            {u.essay > 0 ? <Badge className="bg-purple-100 text-purple-700 text-xs">{u.essay}</Badge> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 pr-2 text-center">
                            {u.swt > 0 ? <Badge className="bg-blue-100 text-blue-700 text-xs">{u.swt}</Badge> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 pr-2 text-center">
                            {u.serverAction > 0 ? <Badge variant="outline" className="text-xs">{u.serverAction}</Badge> : <span className="text-muted-foreground">—</span>}
                          </td>
                          <td className="py-2.5 pr-2 text-center font-bold">{u.total}</td>
                          <td className="py-2.5 pr-2 text-center">
                            {u.errors > 0
                              ? <span className="text-red-600 font-bold text-xs">{u.errors}</span>
                              : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />}
                          </td>
                          <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmt(u.lastSeen)}</td>
                        </tr>
                      ))}
                      {filteredUsers.length === 0 && (
                        <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">No users found{search ? ` matching "${search}"` : ''}.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── TAB: API Keys ── */}
          {activeTab === 'keys' && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {(data?.keySummary ?? []).map(k => (
                <Card key={k.keyLabel} className={k.hasRateLimitAlert ? 'border-orange-300 bg-orange-50/30' : ''}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base font-mono flex items-center gap-2">
                        <Key className="h-4 w-4 text-primary" />
                        {k.keyLabel}
                      </CardTitle>
                      <div className="flex gap-1">
                        {k.hasRateLimitAlert && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs gap-1">
                            <ShieldAlert className="h-3 w-3" />Rate Limited
                          </Badge>
                        )}
                        {k.keyIndex !== null && (
                          <Badge variant="outline" className="text-xs">env var #{k.keyIndex}</Badge>
                        )}
                        {k.keyIndex === null && (
                          <Badge variant="outline" className="text-xs">Firestore key</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <PeriodRow label="Today"  s={k.daily} />
                    <PeriodRow label="7 days" s={k.weekly} />
                    <PeriodRow label="30 days" s={k.monthly} />
                    {k.monthly.requests === 0 && (
                      <p className="text-xs text-muted-foreground italic">No activity in 30 days.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {(data?.keySummary.length ?? 0) === 0 && (
                <Card className="md:col-span-2 xl:col-span-3">
                  <CardContent className="py-12 text-center text-muted-foreground">No API key data yet. Data appears after the first AI call.</CardContent>
                </Card>
              )}
            </div>
          )}

          {/* ── TAB: Activity Log ── */}
          {activeTab === 'log' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Recent Activity</CardTitle>
                <CardDescription>Last 100 AI calls</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b text-left text-[10px] text-muted-foreground uppercase tracking-wider">
                        <th className="pb-2 pr-3 font-semibold">Time</th>
                        <th className="pb-2 pr-3 font-semibold">Email</th>
                        <th className="pb-2 pr-3 font-semibold">IP</th>
                        <th className="pb-2 pr-3 font-semibold">Task</th>
                        <th className="pb-2 pr-3 font-semibold">Key</th>
                        <th className="pb-2 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredLogs.map((l, i) => (
                        <tr key={i} className={`hover:bg-muted/30 transition-colors ${!l.success ? 'bg-red-50/50' : ''}`}>
                          <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{fmt(l.timestamp)}</td>
                          <td className="py-2 pr-3 font-medium">{l.email ?? '—'}</td>
                          <td className="py-2 pr-3 font-mono text-muted-foreground">{l.ip ?? '—'}</td>
                          <td className="py-2 pr-3">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${taskColor[l.task] ?? 'bg-slate-100 text-slate-700'}`}>{l.task}</span>
                          </td>
                          <td className="py-2 pr-3 font-mono text-muted-foreground">{l.keyLabel}</td>
                          <td className="py-2">
                            {l.success
                              ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                              : <span className="flex items-center gap-1">
                                  <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                  {l.isRateLimit && <span className="text-orange-600 text-[10px]">RL</span>}
                                </span>
                            }
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">No activity yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── TAB: Errors ── */}
          {activeTab === 'errors' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Error Log
                </CardTitle>
                <CardDescription>All failed AI calls — rate limits, quota exceeded, and exceptions</CardDescription>
              </CardHeader>
              <CardContent>
                {(data?.errorLog.length ?? 0) === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No errors recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">All AI calls succeeded.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(data?.errorLog ?? []).map((e, i) => (
                      <div key={i} className={`p-3 rounded-lg border text-xs ${e.isRateLimit ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {e.isRateLimit
                              ? <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px]">Rate Limit</Badge>
                              : <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">Error</Badge>}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${taskColor[e.task] ?? 'bg-slate-100 text-slate-700'}`}>{e.task}</span>
                            <span className="font-mono text-muted-foreground">{e.keyLabel}</span>
                          </div>
                          <span className="text-muted-foreground whitespace-nowrap">{fmt(e.timestamp)}</span>
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <p><span className="text-muted-foreground">User: </span><span className="font-medium">{e.email ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">IP: </span><span className="font-mono">{e.ip ?? '—'}</span></p>
                          {e.error && (
                            <p className={`${e.isRateLimit ? 'text-orange-700' : 'text-red-700'} truncate max-w-2xl`} title={e.error}>
                              {e.error}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

        </div>
      </section>
    </div>
  );
}
