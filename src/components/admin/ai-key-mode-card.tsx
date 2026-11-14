'use client';

import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lock, Shuffle, KeyRound } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type ModeInfo = { mode: 'auto' | 'single'; slot: number | null; updatedAt: string | null; updatedBy: string | null; slots: { slot: number; present: boolean }[] };

/**
 * Admin control: let every AI scorer (exams, mocks, practice, chat flows) use ONE chosen key,
 * or go back to automatic rotation. Takes effect on all servers within ~15 seconds.
 * The essay tutor chat is not affected (it keeps its own key while it is being developed).
 */
export function AiKeyModeCard() {
  const { user } = useUser();
  const { toast } = useToast();
  const [info, setInfo] = useState<ModeInfo | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const call = useCallback(async (init?: RequestInit) => {
    if (!user) throw new Error('Not signed in.');
    const res = await fetch('/api/admin/ai-key-mode', { ...init, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${await user.getIdToken()}` } });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Request failed (HTTP ${res.status}).`);
    return data;
  }, [user]);

  useEffect(() => { call().then(setInfo).catch(e => setError(e.message)); }, [call]);

  async function choose(mode: 'auto' | 'single', slot?: number) {
    const label = mode === 'auto' ? 'automatic rotation' : `KEY_${slot} only`;
    if (!confirm(mode === 'auto' ? 'Go back to automatic key rotation for all AI scoring?' : `Use only KEY_${slot} for ALL AI scoring (exams, mocks and practice)? Other keys will not be used.`)) return;
    setSaving(mode === 'auto' ? 'auto' : `k${slot}`); setError('');
    try {
      await call({ method: 'POST', body: JSON.stringify({ mode, slot }) });
      setInfo(await call());
      toast({ title: 'AI key setting saved', description: `Now using ${label}. All servers switch within about 15 seconds.` });
    } catch (e) { setError(e instanceof Error ? e.message : 'Could not save.'); }
    finally { setSaving(null); }
  }

  const single = info?.mode === 'single';
  return (
    <Card className={single ? 'border-primary/40 bg-primary/[0.03]' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> Which key the AI uses</CardTitle>
        <p className="text-xs text-muted-foreground mt-1">
          Choose one key to score <b>everything</b> — PTE &amp; IELTS full mocks, practice scorers and AI flows — with no switching between keys.
          If that key is briefly busy, the AI waits and retries on the same key instead of jumping to another one. Automatic rotates through all keys as before.
          The essay tutor chat is not affected.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {!info && !error && <p className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</p>}
        {error && <p className="text-sm font-semibold text-red-600">{error}</p>}
        {info && (<>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">Now:</span>
            {single
              ? <Badge className="bg-primary text-primary-foreground gap-1"><Lock className="h-3 w-3" /> KEY_{info.slot} only</Badge>
              : <Badge variant="outline" className="gap-1"><Shuffle className="h-3 w-3" /> Automatic rotation</Badge>}
            {info.updatedAt && <span className="text-[11px] text-muted-foreground">changed {new Date(info.updatedAt).toLocaleString()}{info.updatedBy ? ` by ${info.updatedBy}` : ''}</span>}
          </div>
          <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 xl:grid-cols-7">
            <Button variant={single ? 'outline' : 'default'} disabled={!!saving || !single} onClick={() => choose('auto')} className="gap-1.5">
              {saving === 'auto' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />} Automatic
            </Button>
            {info.slots.map(s => {
              const active = single && info.slot === s.slot;
              return (
                <Button key={s.slot} variant={active ? 'default' : 'outline'} disabled={!!saving || !s.present || active} onClick={() => choose('single', s.slot)}
                  className="gap-1.5 font-mono" title={!s.present ? 'Not set on the server' : active ? 'In use' : `Use only KEY_${s.slot}`}>
                  {saving === `k${s.slot}` ? <Loader2 className="h-4 w-4 animate-spin" /> : active ? <Lock className="h-4 w-4" /> : null}
                  KEY_{s.slot}{s.slot === 6 ? ' (mock)' : ''}{!s.present ? ' ·  —' : ''}
                </Button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">Tip: run “Check AI keys” below first and pick a key marked ✓ OK. If a chosen key stops working, switch back to Automatic.</p>
        </>)}
      </CardContent>
    </Card>
  );
}
