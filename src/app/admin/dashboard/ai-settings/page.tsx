'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button }  from '@/components/ui/button';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Badge }   from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import {
  ChevronLeft,
  KeyRound,
  Bot,
  Activity,
  History,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Save,
  AlertTriangle,
  Zap,
  Clock,
  Lock,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface ModelStat {
  successCount : number;
  failureCount : number;
  lastUsedAt   : string | null;
  lastStatus   : 'active' | 'exhausted' | 'error' | 'unknown';
  lastError    : string;
}

interface KeyHistoryEntry {
  changedAt  : string;
  changedBy  : string;
  maskedKey  : string;
  reason     : string;
}

interface AiConfig {
  maskedKey    : string;
  keySource    : 'firestore' | 'env';
  activeModels : string[];
  lastUpdatedAt: string | null;
  lastUpdatedBy: string | null;
  keyHistory   : KeyHistoryEntry[];
  modelStats   : Record<string, ModelStat>;
  totalRequests: number;
}

const KNOWN_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-3.1-pro',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', {
    day   : '2-digit',
    month : 'short',
    year  : 'numeric',
    hour  : '2-digit',
    minute: '2-digit',
  });
}

function ModelStatusBadge({ status }: { status: string }) {
  if (status === 'active')    return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100">Active</Badge>;
  if (status === 'exhausted') return <Badge className="bg-red-100    text-red-700    border-red-300    hover:bg-red-100">Exhausted</Badge>;
  if (status === 'error')     return <Badge className="bg-orange-100 text-orange-700 border-orange-300 hover:bg-orange-100">Error</Badge>;
  return <Badge variant="outline" className="text-muted-foreground">Not Used</Badge>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AiSettingsPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const { firestore }                        = useFirebase();
  const router                               = useRouter();
  const { toast }                            = useToast();

  // ── Auth state
  const [isDeveloper, setIsDeveloper]   = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // ── Config data
  const [config, setConfig]   = useState<AiConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ── Key update form
  const [newKey, setNewKey]           = useState('');
  const [confirmKey, setConfirmKey]   = useState('');
  const [reason, setReason]           = useState('');
  const [showNewKey, setShowNewKey]   = useState(false);
  const [showConfirmKey, setShowConfirmKey] = useState(false);

  // ── Verification state
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [verifyError,  setVerifyError]  = useState('');

  // ── Save state
  const [isSaving, setIsSaving] = useState(false);

  // ─── Get ID token helper ─────────────────────────────────────────────────
  const getToken = useCallback(async () => {
    if (!currentUser) throw new Error('Not authenticated');
    return currentUser.getIdToken();
  }, [currentUser]);

  // ─── Load config from server ─────────────────────────────────────────────
  const loadConfig = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res   = await fetch('/api/admin/ai-config', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to load config');
      }
      setConfig(await res.json());
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error loading config', description: msg, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [getToken, toast]);

  // ─── Auth guard ──────────────────────────────────────────────────────────
  // Client-side: grant access if the signed-in email is the developer email
  // OR if the Firestore role is 'developer'. The server API does its own
  // independent verification via Firebase ID token + email check.
  const DEVELOPER_EMAIL = 'thimira.vishwa2003@gmail.com';

  useEffect(() => {
    if (!isUserLoading && currentUser) {
      const email = (currentUser.email || '').toLowerCase().trim();

      // Fast path — grant by email without a Firestore round-trip
      if (email === DEVELOPER_EMAIL) {
        setIsDeveloper(true);
        loadConfig();
        return;
      }

      // Fallback — check Firestore role for other potential developer accounts
      if (firestore) {
        const userRef = doc(firestore, 'users', currentUser.uid);
        getDoc(userRef).then(snap => {
          if (snap.exists() && snap.data()?.role === 'developer') {
            setIsDeveloper(true);
            loadConfig();
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
  }, [currentUser, isUserLoading, router, firestore, loadConfig]);

  // ─── Reset verify status when keys change ────────────────────────────────
  useEffect(() => {
    setVerifyStatus('idle');
    setVerifyError('');
  }, [newKey, confirmKey]);

  // ─── Verify key ──────────────────────────────────────────────────────────
  const handleVerify = async () => {
    if (!newKey.trim()) {
      toast({ title: 'Enter a key first', variant: 'destructive' });
      return;
    }
    if (newKey !== confirmKey) {
      toast({ title: 'Keys do not match', description: 'Both fields must be identical before verification.', variant: 'destructive' });
      return;
    }
    setVerifyStatus('checking');
    setVerifyError('');
    try {
      const token = await getToken();
      const res   = await fetch('/api/admin/ai-config/verify-key', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body   : JSON.stringify({ apiKey: newKey }),
      });
      const data = await res.json();
      if (data.valid) {
        setVerifyStatus('valid');
        toast({ title: '✓ Key verified', description: data.message });
      } else {
        setVerifyStatus('invalid');
        setVerifyError(data.error || 'Key test failed');
        toast({ title: '✗ Key invalid', description: data.error, variant: 'destructive' });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setVerifyStatus('invalid');
      setVerifyError(msg);
      toast({ title: 'Verification error', description: msg, variant: 'destructive' });
    }
  };

  // ─── Save key ────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (verifyStatus !== 'valid') {
      toast({ title: 'Verify the key first', description: 'Use the Verify button before saving.', variant: 'destructive' });
      return;
    }
    setIsSaving(true);
    try {
      const token = await getToken();
      const res   = await fetch('/api/admin/ai-config', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body   : JSON.stringify({ apiKey: newKey, confirmApiKey: confirmKey, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      toast({ title: '✓ API key saved', description: data.message });
      // Reset form
      setNewKey('');
      setConfirmKey('');
      setReason('');
      setVerifyStatus('idle');
      // Reload config to reflect new state
      await loadConfig();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      toast({ title: 'Save failed', description: msg, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Loading / access denied screens ─────────────────────────────────────
  if (isUserLoading || (!isDeveloper && !accessDenied)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground text-sm font-medium">Verifying developer access…</p>
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
            <CardDescription className="text-red-600">
              This section is restricted to <strong>Developer</strong> accounts only.
              Your current role does not have permission to view AI configuration settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild variant="outline">
              <Link href="/admin/dashboard"><ChevronLeft className="h-4 w-4 mr-2" />Back to Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Derived UI state ─────────────────────────────────────────────────────
  const keysMismatch   = newKey && confirmKey && newKey !== confirmKey;
  const canVerify      = newKey.length > 30 && confirmKey.length > 30 && newKey === confirmKey;
  const canSave        = verifyStatus === 'valid' && !isSaving;

  // ─── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto max-w-5xl">

          {/* ── Header ── */}
          <div className="flex items-center justify-between mb-8 gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/dashboard">
                  <ChevronLeft className="h-4 w-4 mr-1" />Back
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                  <ShieldCheck className="h-7 w-7 text-primary" />
                  AI API Settings
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Manage the Gemini API key used for essay scoring. Developer access only.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive" className="text-xs uppercase tracking-wide">
                Developer Only
              </Badge>
              <Button variant="outline" size="sm" onClick={loadConfig} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-6 animate-pulse">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-32 rounded-lg bg-muted" />
              ))}
            </div>
          ) : config && (
            <div className="grid gap-6">

              {/* ══ Row 1: Current Key Status + Usage Stats ══ */}
              <div className="grid md:grid-cols-2 gap-6">

                {/* Current API Key */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <KeyRound className="h-4 w-4 text-primary" />
                      Current API Key
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="font-mono text-sm bg-background rounded-md px-3 py-2 border break-all select-all">
                      {config.maskedKey}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <span className="font-medium">Source:</span>
                        <Badge variant="outline" className="text-[10px] uppercase h-5">
                          {config.keySource}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {fmtDate(config.lastUpdatedAt)}
                      </div>
                    </div>
                    {config.lastUpdatedBy && (
                      <p className="text-xs text-muted-foreground">
                        Last changed by <span className="font-medium text-foreground">{config.lastUpdatedBy}</span>
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* Usage Stats */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Activity className="h-4 w-4 text-emerald-600" />
                      Usage Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-4xl font-black text-foreground">
                      {config.totalRequests.toLocaleString()}
                    </div>
                    <p className="text-xs text-muted-foreground">Total essay scoring requests made with current key</p>
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

              {/* ══ Row 2: Model Status Grid ══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Bot className="h-4 w-4 text-blue-600" />
                    Model Status
                  </CardTitle>
                  <CardDescription>Real-time status of each Gemini model (updated per request)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {KNOWN_MODELS.map(modelName => {
                      const stat = config.modelStats[modelName];
                      const total    = stat ? stat.successCount + stat.failureCount : 0;
                      const succRate = total ? Math.round((stat.successCount / total) * 100) : null;
                      const status   = stat?.lastStatus ?? 'unknown';

                      return (
                        <div
                          key={modelName}
                          className={`p-4 rounded-lg border flex flex-col gap-2 ${
                            status === 'active'    ? 'border-emerald-200 bg-emerald-50/50' :
                            status === 'exhausted' ? 'border-red-200    bg-red-50/50'    :
                            'border-muted          bg-muted/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-foreground truncate">
                              {modelName}
                            </span>
                            <ModelStatusBadge status={status} />
                          </div>

                          <div className="grid grid-cols-2 gap-1 text-xs">
                            <div className="flex flex-col items-center p-1.5 rounded bg-background border">
                              <span className="font-black text-emerald-600 text-lg leading-none">
                                {stat?.successCount ?? 0}
                              </span>
                              <span className="text-muted-foreground text-[10px]">Success</span>
                            </div>
                            <div className="flex flex-col items-center p-1.5 rounded bg-background border">
                              <span className="font-black text-red-600 text-lg leading-none">
                                {stat?.failureCount ?? 0}
                              </span>
                              <span className="text-muted-foreground text-[10px]">Failed</span>
                            </div>
                          </div>

                          {succRate !== null && (
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  succRate >= 90 ? 'bg-emerald-500' :
                                  succRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${succRate}%` }}
                              />
                            </div>
                          )}

                          <div className="text-[10px] text-muted-foreground space-y-0.5">
                            <p>Last: {fmtDate(stat?.lastUsedAt ?? null)}</p>
                            {stat?.lastError && (
                              <p className="text-red-600 truncate" title={stat.lastError}>
                                ✗ {stat.lastError}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* ══ Row 3: Update API Key ══ */}
              <Card className="border-amber-200">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Update API Key
                  </CardTitle>
                  <CardDescription>
                    Enter the new key in both fields — they must match exactly. Verify the key works before saving.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">

                  {/* Security notice */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      This change takes effect within <strong>2 minutes</strong>. All essay scoring
                      requests will automatically switch to the new key. The old key is logged in
                      history below.
                    </span>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* New key field */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new-key">New API Key <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input
                          id="new-key"
                          type={showNewKey ? 'text' : 'password'}
                          value={newKey}
                          onChange={e => setNewKey(e.target.value.trim())}
                          placeholder="AIza…"
                          className={`pr-10 font-mono text-sm ${keysMismatch ? 'border-red-400' : ''}`}
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewKey(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm key field */}
                    <div className="space-y-1.5">
                      <Label htmlFor="confirm-key">Confirm API Key <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <Input
                          id="confirm-key"
                          type={showConfirmKey ? 'text' : 'password'}
                          value={confirmKey}
                          onChange={e => setConfirmKey(e.target.value.trim())}
                          placeholder="Re-enter the same key"
                          className={`pr-10 font-mono text-sm ${keysMismatch ? 'border-red-400' : ''}`}
                          disabled={isSaving}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmKey(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {keysMismatch && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Keys do not match
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Reason field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="reason">Reason for Change <span className="text-muted-foreground text-xs">(optional)</span></Label>
                    <Input
                      id="reason"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      placeholder="e.g. Previous key quota exhausted, rotating for security…"
                      disabled={isSaving}
                    />
                  </div>

                  {/* Verification result banner */}
                  {verifyStatus === 'valid' && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-700 text-sm font-medium">
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                      Key verified and working — ready to save.
                    </div>
                  )}
                  {verifyStatus === 'invalid' && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-300 text-red-700 text-sm">
                      <XCircle className="h-5 w-5 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">Key verification failed</p>
                        <p className="text-xs mt-0.5">{verifyError}</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={handleVerify}
                      disabled={!canVerify || verifyStatus === 'checking' || isSaving}
                      className="gap-2"
                    >
                      {verifyStatus === 'checking' ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Verifying…</>
                      ) : verifyStatus === 'valid' ? (
                        <><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Re-Verify Key</>
                      ) : (
                        <><ShieldCheck className="h-4 w-4" /> Verify Key</>
                      )}
                    </Button>

                    <Button
                      onClick={handleSave}
                      disabled={!canSave}
                      className="gap-2 bg-primary hover:bg-primary/90"
                    >
                      {isSaving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Saving…</>
                      ) : (
                        <><Save className="h-4 w-4" /> Save New Key</>
                      )}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    ① Enter key in both fields → ② Click <strong>Verify Key</strong> (live test against Gemini API) → ③ Click <strong>Save New Key</strong>
                  </p>
                </CardContent>
              </Card>

              {/* ══ Row 4: Key Change History ══ */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <History className="h-4 w-4 text-slate-500" />
                    Key Change History
                  </CardTitle>
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

            </div>
          )}
        </div>
      </section>
    </div>
  );
}
