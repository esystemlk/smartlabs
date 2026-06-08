'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Badge }   from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  ChevronLeft, KeyRound, Bot, Activity, History, ShieldCheck,
  Eye, EyeOff, CheckCircle2, XCircle, Loader2, RefreshCw, Save,
  AlertTriangle, Zap, Clock, Lock, Users, Key, Search, ShieldAlert,
} from 'lucide-react';

// ─── Types: AI Config ─────────────────────────────────────────────────────────
interface ModelStat {
  successCount: number; failureCount: number;
  lastUsedAt: string | null;
  lastStatus: 'active' | 'exhausted' | 'error' | 'unknown';
  lastError: string;
}
interface KeyHistoryEntry { changedAt: string; changedBy: string; maskedKey: string; reason: string }
interface AiConfig {
  maskedKey: string; keySource: 'firestore' | 'env';
  activeModels: string[]; lastUpdatedAt: string | null; lastUpdatedBy: string | null;
  keyHistory: KeyHistoryEntry[]; modelStats: Record<string, ModelStat>; totalRequests: number;
}

// ─── Types: Usage Tracker ─────────────────────────────────────────────────────
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
interface ModelSummaryEntry {
  name: string; requests: number; successes: number; failures: number; lastUsed: string | null;
}
interface LogEntry {
  email: string | null; ip: string | null; task: string;
  keyLabel: string; model?: string | null; success: boolean; isRateLimit: boolean;
  error: string | null; timestamp: string;
}
interface UsageData {
  userSummary: UserSummary[]; keySummary: KeySummary[];
  modelSummary: ModelSummaryEntry[];
  errorLog: LogEntry[]; recentLogs: LogEntry[];
  meta: { totalLogs: number; days: number };
}

// All expected API key labels — always shown even if no data yet
const ALL_KEY_LABELS = ['KEY_1', 'KEY_2', 'KEY_3', 'KEY_4', 'KEY_5', 'FIRESTORE_KEY', 'ENV_KEY'];
const EMPTY_PERIOD: PeriodStats = { requests: 0, successes: 0, failures: 0, rateLimitHits: 0 };

// ─── Constants ────────────────────────────────────────────────────────────────
const KNOWN_MODELS = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash', 'gemini-3.1-pro'];
const DEVELOPER_EMAIL = 'thimira.vishwa2003@gmail.com';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (iso: string | null) => !iso ? '—' : new Date(iso).toLocaleString('en-GB', {
  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
});
const fmtShort = (iso: string | null) => !iso ? '—' : new Date(iso).toLocaleString('en-GB', {
  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
});

const taskColor: Record<string, string> = {
  essay: 'bg-purple-100 text-purple-700',
  swt:   'bg-blue-100 text-blue-700',
  'server-action': 'bg-slate-100 text-slate-700',
};

function ModelStatusBadge({ status }: { status: string }) {
  if (status === 'active')    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100">Active</Badge>;
  if (status === 'exhausted') return <Badge className="bg-red-100 text-red-700 border-red-300 hover:bg-red-100">Exhausted</Badge>;
  if (status === 'error')     return <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100">Error</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not Used</Badge>;
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
        {rate !== null && (
          <span className={`px-1.5 py-0.5 rounded font-bold ${rate >= 90 ? 'bg-emerald-100 text-emerald-700' : rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
            {rate}%
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AiSettingsPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const { firestore }                        = useFirebase();
  const router                               = useRouter();
  const { toast }                            = useToast();

  const [isDeveloper, setIsDeveloper]   = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // ── Main tab ──────────────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<'settings' | 'users' | 'keys' | 'log' | 'errors'>('settings');

  // ── Config state ──────────────────────────────────────────────────────────
  const [config, setConfig]       = useState<AiConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);

  // ── Key update form ───────────────────────────────────────────────────────
  const [newKey, setNewKey]             = useState('');
  const [confirmKey, setConfirmKey]     = useState('');
  const [reason, setReason]             = useState('');
  const [showNewKey, setShowNewKey]     = useState(false);
  const [showConfirmKey, setShowConfirmKey] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [verifyError, setVerifyError]   = useState('');
  const [isSaving, setIsSaving]         = useState(false);

  // ── Usage state ───────────────────────────────────────────────────────────
  const [usage, setUsage]               = useState<UsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);
  const [search, setSearch]             = useState('');

  // ─── Token helper ─────────────────────────────────────────────────────────
  const getToken = useCallback(async () => {
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  }, [currentUser]);

  // ─── Load config ──────────────────────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setIsLoadingConfig(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-config', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setConfig(await res.json());
    } catch (err: unknown) {
      toast({ title: 'Error loading config', description: String(err instanceof Error ? err.message : err), variant: 'destructive' });
    } finally {
      setIsLoadingConfig(false);
    }
  }, [getToken, toast]);

  // ─── Load usage ───────────────────────────────────────────────────────────
  const loadUsage = useCallback(async () => {
    setIsLoadingUsage(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-usage?days=30&limit=300', { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed');
      setUsage(await res.json());
    } catch (err: unknown) {
      toast({ title: 'Error loading usage', description: String(err instanceof Error ? err.message : err), variant: 'destructive' });
    } finally {
      setIsLoadingUsage(false);
    }
  }, [getToken, toast]);

  // ─── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isUserLoading && currentUser) {
      const email = (currentUser.email || '').toLowerCase().trim();
      if (email === DEVELOPER_EMAIL) {
        setIsDeveloper(true);
        loadConfig();
        loadUsage();
        return;
      }
      if (firestore) {
        getDoc(doc(firestore, 'users', currentUser.uid)).then(snap => {
          const role = snap.data()?.role;
          if (snap.exists() && (role === 'developer' || role === 'admin')) {
            setIsDeveloper(true);
            loadConfig();
            loadUsage();
          } else {
            setAccessDenied(true);
          }
        }).catch(() => setAccessDenied(true));
      } else {
        setAccessDenied(true);
      }
    } else if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router, firestore, loadConfig, loadUsage]);

  useEffect(() => { setVerifyStatus('idle'); setVerifyError(''); }, [newKey, confirmKey]);

  // ─── Verify key ───────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!newKey.trim()) { toast({ title: 'Enter a key first', variant: 'destructive' }); return; }
    if (newKey !== confirmKey) { toast({ title: 'Keys do not match', variant: 'destructive' }); return; }
    setVerifyStatus('checking'); setVerifyError('');
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-config/verify-key', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey: newKey }),
      });
      const data = await res.json();
      if (data.valid) { setVerifyStatus('valid'); toast({ title: '✓ Key verified', description: data.message }); }
      else { setVerifyStatus('invalid'); setVerifyError(data.error || 'Key test failed'); toast({ title: '✗ Key invalid', description: data.error, variant: 'destructive' }); }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setVerifyStatus('invalid'); setVerifyError(msg);
      toast({ title: 'Verification error', description: msg, variant: 'destructive' });
    }
  };

  // ─── Save key ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (verifyStatus !== 'valid') { toast({ title: 'Verify the key first', variant: 'destructive' }); return; }
    setIsSaving(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/admin/ai-config', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ apiKey: newKey, confirmApiKey: confirmKey, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast({ title: '✓ API key saved', description: data.message });
      setNewKey(''); setConfirmKey(''); setReason(''); setVerifyStatus('idle');
      await loadConfig();
    } catch (err: unknown) {
      toast({ title: 'Save failed', description: String(err instanceof Error ? err.message : err), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading / access denied ──────────────────────────────────────────────
  if (isUserLoading || (!isDeveloper && !accessDenied)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Verifying access…</p>
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
            <CardDescription className="text-red-600">Admin or Developer access only.</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline"><Link href="/admin/dashboard"><ChevronLeft className="h-4 w-4 mr-2" />Back</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Derived values ───────────────────────────────────────────────────────
  const keysMismatch = newKey && confirmKey && newKey !== confirmKey;
  const canVerify    = newKey.length > 30 && confirmKey.length > 30 && newKey === confirmKey;
  const canSave      = verifyStatus === 'valid' && !isSaving;

  const rateLimitKeys  = usage?.keySummary.filter(k => k.hasRateLimitAlert) ?? [];
  const totalErrors    = usage?.errorLog.length ?? 0;
  const totalRequests  = usage?.keySummary.reduce((s, k) => s + k.monthly.requests, 0) ?? 0;

  // Always show all expected key labels, filling with zero data for unused ones.
  // ENV_KEY only shows if it has real data (it's a fallback, not expected in normal use).
  const allKeySummary: KeySummary[] = ALL_KEY_LABELS
    .filter(label => label !== 'ENV_KEY' || (usage?.keySummary.some(k => k.keyLabel === 'ENV_KEY')))
    .map(label => {
      const found = usage?.keySummary.find(k => k.keyLabel === label);
      return found ?? {
        keyLabel: label,
        keyIndex: label.startsWith('KEY_') ? parseInt(label.split('_')[1]) : null,
        daily:   EMPTY_PERIOD,
        weekly:  EMPTY_PERIOD,
        monthly: EMPTY_PERIOD,
        hasRateLimitAlert: false,
      };
    });

  const filteredUsers  = (usage?.userSummary ?? []).filter(u =>
    !search || u.email.toLowerCase().includes(search.toLowerCase()) || u.ips.some(ip => ip.includes(search))
  );
  const filteredLogs   = (usage?.recentLogs ?? []).filter(l =>
    !search || (l.email ?? '').toLowerCase().includes(search.toLowerCase()) || (l.ip ?? '').includes(search)
  );

  // ─── Tab definitions ──────────────────────────────────────────────────────
  const tabs = [
    { key: 'settings', label: 'API Settings',    icon: KeyRound },
    { key: 'users',    label: 'Users',            icon: Users,       badge: usage?.userSummary.length },
    { key: 'keys',     label: 'Key Stats',         icon: Key,        badge: usage?.keySummary.length },
    { key: 'log',      label: 'Activity',          icon: Activity,   badge: usage?.meta.totalLogs },
    { key: 'errors',   label: 'Errors',            icon: AlertTriangle, badge: totalErrors, redBadge: totalErrors > 0 },
  ] as const;

  const isUsageTab = activeTab !== 'settings';

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-6xl">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm"><Link href="/admin/dashboard"><ChevronLeft className="h-4 w-4 mr-1" />Back</Link></Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                  AI Settings & Usage
                </h1>
                <p className="text-muted-foreground text-sm mt-1">Manage API keys and monitor usage. Developer / Admin access only.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs uppercase tracking-wide">Developer Only</Badge>
              <Button variant="outline" size="sm" onClick={() => { loadConfig(); loadUsage(); }} disabled={isLoadingConfig || isLoadingUsage}>
                <RefreshCw className={`h-4 w-4 mr-2 ${(isLoadingConfig || isLoadingUsage) ? 'animate-spin' : ''}`} />Refresh
              </Button>
            </div>
          </div>

          {/* ── Rate-limit alert banner ── */}
          {rateLimitKeys.length > 0 && (
            <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-orange-50 border border-orange-300 text-orange-800">
              <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Rate limit hits detected</p>
                <p className="text-xs mt-0.5">
                  Keys with rate-limit errors: <span className="font-mono font-bold">{rateLimitKeys.map(k => k.keyLabel).join(', ')}</span>.
                  Consider rotating or adding more keys.
                </p>
              </div>
            </div>
          )}

          {/* ── Summary cards (always visible) ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl font-black">{config?.totalRequests.toLocaleString() ?? '—'}</div>
                <p className="text-xs text-muted-foreground mt-1">Total essay scorings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl font-black">{totalRequests || '—'}</div>
                <p className="text-xs text-muted-foreground mt-1">AI calls (30 days)</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="text-3xl font-black">{usage?.userSummary.length ?? '—'}</div>
                <p className="text-xs text-muted-foreground mt-1">Unique users</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className={`text-3xl font-black ${totalErrors > 0 ? 'text-red-600' : 'text-emerald-600'}`}>{totalErrors || '0'}</div>
                <p className="text-xs text-muted-foreground mt-1">Errors (30 days)</p>
              </CardContent>
            </Card>
          </div>

          {/* ── Tabs ── */}
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
                {'badge' in t && t.badge !== undefined && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    'redBadge' in t && t.redBadge
                      ? 'bg-red-500 text-white'
                      : activeTab === t.key
                        ? 'bg-primary-foreground/20 text-primary-foreground'
                        : 'bg-background text-foreground'
                  }`}>{t.badge}</span>
                )}
              </button>
            ))}
          </div>

          {/* ── Search bar (usage tabs only) ── */}
          {(activeTab === 'users' || activeTab === 'log') && (
            <div className="relative mb-4 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search email or IP…" className="pl-9" />
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB: API SETTINGS
          ════════════════════════════════════════ */}
          {activeTab === 'settings' && (
            <div className="grid gap-6">

              {isLoadingConfig ? (
                <div className="grid gap-6 animate-pulse">{[1, 2, 3].map(i => <div key={i} className="h-32 rounded-lg bg-muted" />)}</div>
              ) : config && (<>

                {/* Row 1: Key status + usage */}
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="border-primary/20 bg-primary/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" />Current API Key</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="font-mono text-sm bg-background rounded-md px-3 py-2 border break-all select-all">{config.maskedKey}</div>
                      <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">Source:</span>
                          <Badge variant="outline" className="text-[10px] uppercase h-5">{config.keySource}</Badge>
                        </div>
                        <div className="flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(config.lastUpdatedAt)}</div>
                      </div>
                      {config.lastUpdatedBy && (
                        <p className="text-xs text-muted-foreground">Last changed by <span className="font-medium text-foreground">{config.lastUpdatedBy}</span></p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-emerald-600" />Usage Statistics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-4xl font-black">{config.totalRequests.toLocaleString()}</div>
                      <p className="text-xs text-muted-foreground">Total essay scoring requests with current key</p>
                      <div className="flex gap-2 flex-wrap">
                        {Object.entries(config.modelStats).map(([name, stat]) => {
                          const total = stat.successCount + stat.failureCount;
                          const rate  = total ? Math.round((stat.successCount / total) * 100) : null;
                          return (
                            <Badge key={name} variant="outline" className="text-xs gap-1">
                              {name.replace('gemini-', 'g-')}
                              {rate !== null && <span className="text-emerald-600 font-bold">{rate}%</span>}
                            </Badge>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Row 2: Model status grid — combines ai_config stats + usage log stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-blue-600" />Model Status</CardTitle>
                    <CardDescription>Usage per Gemini model — config stats (Essay/SWT) + log-based stats (all tasks)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Config-based stats (FIRESTORE_KEY path: essay + swt) */}
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Essay &amp; SWT scoring models (Firestore key)</p>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {KNOWN_MODELS.map(modelName => {
                          const stat     = config.modelStats[modelName];
                          const total    = stat ? stat.successCount + stat.failureCount : 0;
                          const succRate = total ? Math.round((stat.successCount / total) * 100) : null;
                          const status   = stat?.lastStatus ?? 'unknown';
                          // merge with log-based stats for richer numbers
                          const logStat  = usage?.modelSummary?.find(m => m.name === modelName);
                          const logTotal = logStat?.requests ?? 0;
                          return (
                            <div key={modelName} className={`p-3 rounded-lg border flex flex-col gap-2 ${status === 'active' ? 'border-emerald-200 bg-emerald-50/50' : status === 'exhausted' ? 'border-red-200 bg-red-50/50' : 'border-muted bg-muted/30'}`}>
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="font-mono text-xs font-bold truncate">{modelName}</span>
                                <ModelStatusBadge status={logTotal > 0 ? (status === 'unknown' ? 'active' : status) : status} />
                              </div>
                              <div className="grid grid-cols-2 gap-1 text-xs">
                                <div className="flex flex-col items-center p-1.5 rounded bg-background border">
                                  <span className="font-black text-emerald-600 text-lg leading-none">{logStat?.successes ?? stat?.successCount ?? 0}</span>
                                  <span className="text-muted-foreground text-[10px]">Success</span>
                                </div>
                                <div className="flex flex-col items-center p-1.5 rounded bg-background border">
                                  <span className="font-black text-red-600 text-lg leading-none">{logStat?.failures ?? stat?.failureCount ?? 0}</span>
                                  <span className="text-muted-foreground text-[10px]">Failed</span>
                                </div>
                              </div>
                              {succRate !== null && (
                                <div className="w-full bg-muted rounded-full h-1.5">
                                  <div className={`h-1.5 rounded-full transition-all ${succRate >= 90 ? 'bg-emerald-500' : succRate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${succRate}%` }} />
                                </div>
                              )}
                              <div className="text-[10px] text-muted-foreground space-y-0.5">
                                {logTotal > 0 && <p className="text-slate-500 font-medium">Total logged: {logTotal} calls</p>}
                                <p>Last: {fmtDate(stat?.lastUsedAt ?? null)}</p>
                                {stat?.lastError && <p className="text-red-600 truncate" title={stat.lastError}>✗ {stat.lastError}</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Genkit flows always use gemini-2.5-flash — show its log stats */}
                    {(usage?.modelSummary?.find(m => m.name === 'gemini-2.5-flash')?.requests ?? 0) > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">Genkit practice flows (KEY_1–5, always gemini-2.5-flash)</p>
                        {(() => {
                          const genkitStat = usage?.modelSummary?.find(m => m.name === 'gemini-2.5-flash');
                          if (!genkitStat) return null;
                          const rate = genkitStat.requests ? Math.round((genkitStat.successes / genkitStat.requests) * 100) : null;
                          return (
                            <div className="flex flex-wrap gap-3 items-center p-3 rounded-lg border bg-blue-50/30 border-blue-200">
                              <span className="font-mono text-sm font-bold text-blue-700">gemini-2.5-flash</span>
                              <span className="text-xs text-muted-foreground">{genkitStat.requests} total calls</span>
                              <span className="text-xs text-emerald-600 font-semibold">{genkitStat.successes} ok</span>
                              {genkitStat.failures > 0 && <span className="text-xs text-red-600 font-semibold">{genkitStat.failures} failed</span>}
                              {rate !== null && <span className={`text-xs font-bold px-2 py-0.5 rounded ${rate >= 90 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{rate}%</span>}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Row 3: Update key */}
                <Card className="border-amber-200">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" />Update API Key</CardTitle>
                    <CardDescription>Enter key in both fields — they must match. Verify before saving.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                      <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                      <span>Change takes effect within <strong>2 minutes</strong>. Old key is logged in history.</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="new-key">New API Key <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input id="new-key" type={showNewKey ? 'text' : 'password'} value={newKey} onChange={e => setNewKey(e.target.value.trim())} placeholder="AIza…" className={`pr-10 font-mono text-sm ${keysMismatch ? 'border-red-400' : ''}`} disabled={isSaving} />
                          <button type="button" onClick={() => setShowNewKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="confirm-key">Confirm API Key <span className="text-red-500">*</span></Label>
                        <div className="relative">
                          <Input id="confirm-key" type={showConfirmKey ? 'text' : 'password'} value={confirmKey} onChange={e => setConfirmKey(e.target.value.trim())} placeholder="Re-enter the same key" className={`pr-10 font-mono text-sm ${keysMismatch ? 'border-red-400' : ''}`} disabled={isSaving} />
                          <button type="button" onClick={() => setShowConfirmKey(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                            {showConfirmKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {keysMismatch && <p className="text-xs text-red-500 flex items-center gap-1"><XCircle className="h-3 w-3" /> Keys do not match</p>}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reason">Reason <span className="text-muted-foreground text-xs">(optional)</span></Label>
                      <Input id="reason" value={reason} onChange={e => setReason(e.target.value)} placeholder="e.g. Quota exhausted, rotating for security…" disabled={isSaving} />
                    </div>
                    {verifyStatus === 'valid' && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm font-medium">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />Key verified — ready to save.
                      </div>
                    )}
                    {verifyStatus === 'invalid' && (
                      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm">
                        <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <div><p className="font-medium">Verification failed</p><p className="text-xs mt-0.5">{verifyError}</p></div>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline" onClick={handleVerify} disabled={!canVerify || verifyStatus === 'checking' || isSaving} className="gap-2">
                        {verifyStatus === 'checking' ? <><Loader2 className="h-4 w-4 animate-spin" />Verifying…</> : verifyStatus === 'valid' ? <><CheckCircle2 className="h-4 w-4 text-emerald-600" />Re-Verify</> : <><ShieldCheck className="h-4 w-4" />Verify Key</>}
                      </Button>
                      <Button onClick={handleSave} disabled={!canSave} className="gap-2 bg-primary hover:bg-primary/90">
                        {isSaving ? <><Loader2 className="h-4 w-4 animate-spin" />Saving…</> : <><Save className="h-4 w-4" />Save New Key</>}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">① Enter key → ② Verify → ③ Save</p>
                  </CardContent>
                </Card>

                {/* Row 4: Key change history */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4 text-slate-500" />Key Change History</CardTitle>
                    <CardDescription>Last 10 API key changes (newest first)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {config.keyHistory.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-4 text-center">No changes recorded yet.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-left text-xs text-muted-foreground uppercase tracking-wider">
                              <th className="pb-2 pr-4 font-semibold">Date & Time</th>
                              <th className="pb-2 pr-4 font-semibold">Changed By</th>
                              <th className="pb-2 pr-4 font-semibold">Key (masked)</th>
                              <th className="pb-2 font-semibold">Reason</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {config.keyHistory.map((entry, idx) => (
                              <tr key={idx} className={`${idx === 0 ? 'bg-primary/5' : ''} hover:bg-muted/30 transition-colors`}>
                                <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                                  {idx === 0 && <Badge className="text-[9px] mr-1 py-0" variant="outline">Latest</Badge>}
                                  {fmtDate(entry.changedAt)}
                                </td>
                                <td className="py-3 pr-4 font-medium text-xs">{entry.changedBy}</td>
                                <td className="py-3 pr-4 font-mono text-xs">{entry.maskedKey}</td>
                                <td className="py-3 text-xs text-muted-foreground">{entry.reason || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>

              </>)}
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB: USERS
          ════════════════════════════════════════ */}
          {activeTab === 'users' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Per-User AI Usage</CardTitle>
                <CardDescription>Sorted by total calls — last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsage ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
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
                            <td className="py-2.5 pr-4 text-xs">
                              {u.ips.length === 0 ? <span className="text-muted-foreground">—</span> : u.ips.map((ip, j) => (
                                <span key={j} className="inline-block font-mono bg-slate-100 rounded px-1 mr-1 mb-0.5 text-[10px]">{ip}</span>
                              ))}
                            </td>
                            <td className="py-2.5 pr-2 text-center">
                              {u.essay > 0 ? <Badge className="bg-purple-100 text-purple-700 text-xs">{u.essay}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="py-2.5 pr-2 text-center">
                              {u.swt > 0 ? <Badge className="bg-blue-100 text-blue-700 text-xs">{u.swt}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="py-2.5 pr-2 text-center">
                              {u.serverAction > 0 ? <Badge variant="outline" className="text-xs">{u.serverAction}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                            </td>
                            <td className="py-2.5 pr-2 text-center font-bold text-sm">{u.total}</td>
                            <td className="py-2.5 pr-2 text-center">
                              {u.errors > 0 ? <span className="text-red-600 font-bold text-xs">{u.errors}</span> : <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 mx-auto" />}
                            </td>
                            <td className="py-2.5 text-xs text-muted-foreground whitespace-nowrap">{fmtShort(u.lastSeen)}</td>
                          </tr>
                        ))}
                        {filteredUsers.length === 0 && (
                          <tr><td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">No users found{search ? ` matching "${search}"` : '. Data appears after first AI call.'}.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════
              TAB: KEY STATS
          ════════════════════════════════════════ */}
          {activeTab === 'keys' && (
            <div className="space-y-6">
              {isLoadingUsage ? (
                <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
              ) : (<>

                {/* ── Key cards ── */}
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {allKeySummary.map(k => {
                    const isFirestore = k.keyLabel === 'FIRESTORE_KEY';
                    const isEnvFallback = k.keyLabel === 'ENV_KEY';
                    const keyNum      = k.keyIndex;
                    const hasActivity = k.monthly.requests > 0;
                    return (
                      <Card key={k.keyLabel} className={`${k.hasRateLimitAlert ? 'border-orange-300 bg-orange-50/30' : hasActivity ? 'border-emerald-200' : 'border-muted'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <CardTitle className="text-base font-mono flex items-center gap-2">
                              <Key className={`h-4 w-4 ${hasActivity ? 'text-emerald-600' : 'text-muted-foreground'}`} />
                              {k.keyLabel}
                            </CardTitle>
                            <div className="flex gap-1 flex-wrap">
                              {k.hasRateLimitAlert && (
                                <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-xs gap-1">
                                  <ShieldAlert className="h-3 w-3" />Rate Limited
                                </Badge>
                              )}
                              <Badge variant={hasActivity ? 'default' : 'outline'} className={`text-xs ${hasActivity ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100' : 'text-muted-foreground'}`}>
                                {isFirestore ? 'Firestore key (Essay/SWT)' : isEnvFallback ? '.env fallback (Essay/SWT)' : `env KEY_${keyNum} (Genkit flows)`}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            {isFirestore
                              ? 'Used by score-essay & score-swt API routes. Tries gemini-2.5-flash → 2.5-pro → 2.0-flash → 3.1-pro in order.'
                              : isEnvFallback
                              ? 'GEMINI_API_KEY or GOOGLE_GENAI_API_KEY env var — used as fallback when Firestore key is not set.'
                              : `GOOGLE_GENAI_API_KEY_${keyNum} — used by AI practice flows (gemini-2.5-flash only)`}
                          </p>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <PeriodRow label="Today"   s={k.daily} />
                          <PeriodRow label="7 days"  s={k.weekly} />
                          <PeriodRow label="30 days" s={k.monthly} />
                          {!hasActivity && (
                            <p className="text-xs text-muted-foreground italic mt-2">No activity recorded yet.</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* ── Per-model usage summary ── */}
                {(usage?.modelSummary?.length ?? 0) > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-blue-600" />Model Usage (from logs)</CardTitle>
                      <CardDescription>How many calls each Gemini model handled — last 30 days</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {(usage?.modelSummary ?? []).map(m => {
                          const rate = m.requests ? Math.round((m.successes / m.requests) * 100) : null;
                          return (
                            <div key={m.name} className="p-3 rounded-lg border bg-muted/20 space-y-2">
                              <div className="flex items-center justify-between gap-1 flex-wrap">
                                <span className="font-mono text-xs font-bold truncate">{m.name}</span>
                                {rate !== null && (
                                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${rate >= 90 ? 'bg-emerald-100 text-emerald-700' : rate >= 70 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{rate}%</span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-1 text-center text-xs">
                                <div className="rounded bg-background border p-1">
                                  <div className="font-black text-slate-700 text-base leading-none">{m.requests}</div>
                                  <div className="text-muted-foreground text-[10px]">total</div>
                                </div>
                                <div className="rounded bg-background border p-1">
                                  <div className="font-black text-emerald-600 text-base leading-none">{m.successes}</div>
                                  <div className="text-muted-foreground text-[10px]">ok</div>
                                </div>
                                <div className="rounded bg-background border p-1">
                                  <div className={`font-black text-base leading-none ${m.failures > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{m.failures}</div>
                                  <div className="text-muted-foreground text-[10px]">fail</div>
                                </div>
                              </div>
                              {rate !== null && (
                                <div className="w-full bg-muted rounded-full h-1">
                                  <div className={`h-1 rounded-full ${rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${rate}%` }} />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

              </>)}
            </div>
          )}

          {/* ════════════════════════════════════════
              TAB: ACTIVITY LOG
          ════════════════════════════════════════ */}
          {activeTab === 'log' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" />Recent Activity</CardTitle>
                <CardDescription>Last 100 AI calls — newest first</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsage ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b text-left text-[10px] text-muted-foreground uppercase tracking-wider">
                          <th className="pb-2 pr-3 font-semibold">Time</th>
                          <th className="pb-2 pr-3 font-semibold">Email</th>
                          <th className="pb-2 pr-3 font-semibold">IP</th>
                          <th className="pb-2 pr-3 font-semibold">Task</th>
                          <th className="pb-2 pr-3 font-semibold">Key</th>
                          <th className="pb-2 pr-3 font-semibold">Model</th>
                          <th className="pb-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {filteredLogs.map((l, i) => (
                          <tr key={i} className={`hover:bg-muted/30 transition-colors ${!l.success ? 'bg-red-50/50' : ''}`}>
                            <td className="py-2 pr-3 whitespace-nowrap text-muted-foreground">{fmtShort(l.timestamp)}</td>
                            <td className="py-2 pr-3 font-medium">{l.email ?? '—'}</td>
                            <td className="py-2 pr-3 font-mono text-muted-foreground">{l.ip ?? '—'}</td>
                            <td className="py-2 pr-3">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${taskColor[l.task] ?? 'bg-slate-100 text-slate-700'}`}>{l.task}</span>
                            </td>
                            <td className="py-2 pr-3 font-mono text-muted-foreground text-[10px]">{l.keyLabel}</td>
                            <td className="py-2 pr-3 font-mono text-[10px] text-blue-600">{l.model ? l.model.replace('gemini-', 'g-') : '—'}</td>
                            <td className="py-2">
                              {l.success
                                ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                : <span className="flex items-center gap-1">
                                    <XCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
                                    {l.isRateLimit && <span className="text-orange-600 text-[10px] font-bold">RL</span>}
                                  </span>
                              }
                            </td>
                          </tr>
                        ))}
                        {filteredLogs.length === 0 && (
                          <tr><td colSpan={7} className="py-8 text-center text-muted-foreground">No activity yet.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ════════════════════════════════════════
              TAB: ERRORS
          ════════════════════════════════════════ */}
          {activeTab === 'errors' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />Error Log
                </CardTitle>
                <CardDescription>All failed AI calls — rate limits, quota exceeded, exceptions</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingUsage ? (
                  <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : (usage?.errorLog.length ?? 0) === 0 ? (
                  <div className="py-12 text-center">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No errors recorded</p>
                    <p className="text-xs text-muted-foreground mt-1">All AI calls succeeded.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(usage?.errorLog ?? []).map((e, i) => (
                      <div key={i} className={`p-3 rounded-lg border text-xs ${e.isRateLimit ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}`}>
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {e.isRateLimit
                              ? <Badge className="bg-orange-100 text-orange-700 border-orange-300 text-[10px]">Rate Limit</Badge>
                              : <Badge className="bg-red-100 text-red-700 border-red-300 text-[10px]">Error</Badge>}
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${taskColor[e.task] ?? 'bg-slate-100 text-slate-700'}`}>{e.task}</span>
                            <span className="font-mono text-muted-foreground text-[10px]">{e.keyLabel}</span>
                          </div>
                          <span className="text-muted-foreground whitespace-nowrap">{fmtShort(e.timestamp)}</span>
                        </div>
                        <div className="mt-1.5 space-y-0.5">
                          <p><span className="text-muted-foreground">User: </span><span className="font-medium">{e.email ?? '—'}</span></p>
                          <p><span className="text-muted-foreground">IP: </span><span className="font-mono">{e.ip ?? '—'}</span></p>
                          {e.error && (
                            <p className={`${e.isRateLimit ? 'text-orange-700' : 'text-red-700'} truncate max-w-2xl`} title={e.error}>{e.error}</p>
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
