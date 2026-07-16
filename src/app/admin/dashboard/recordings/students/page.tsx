'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft, Users, Loader2, Search, Clock, Ban, CheckCircle2,
  Trash2, CalendarPlus, ArrowRightLeft,
} from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { listAllAccess, listRecordings, isAccessValid, daysLeft, accessExpiryDate } from '@/lib/services/recordings.service';
import { type ClassRecording, type RecordingAccess, monthLabel } from '@/types/recording';

export default function AdminRecordingStudentsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [access, setAccess] = useState<RecordingAccess[]>([]);
  const [recordings, setRecordings] = useState<ClassRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [moving, setMoving] = useState<RecordingAccess | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [a, r] = await Promise.all([listAllAccess(), listRecordings()]);
      setAccess(a); setRecordings(r);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Failed to load', description: String(e) });
    } finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const call = async (payload: Record<string, unknown>, okMsg: string) => {
    if (!user) return;
    setBusy(String(payload.accessId ?? 'x'));
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/admin/recording-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { toast({ variant: 'destructive', title: data.error || 'Action failed' }); return; }
      toast({ title: okMsg });
      setMoving(null);
      await load();
    } catch {
      toast({ variant: 'destructive', title: 'Network error' });
    } finally { setBusy(null); }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return access;
    return access.filter(a =>
      (a.userEmail ?? '').toLowerCase().includes(s) ||
      (a.userName ?? '').toLowerCase().includes(s) ||
      (a.recordingTitle ?? '').toLowerCase().includes(s)
    );
  }, [access, search]);

  const activeCount = access.filter(a => isAccessValid(a)).length;
  const revenue = access.reduce((sum, a) => sum + (a.amountPaid ?? 0), 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <Link href="/admin/dashboard/recordings" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-foreground mb-3">
          <ArrowLeft size={16} /> Back to Recordings
        </Link>
        <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
          <Users className="h-7 w-7 text-violet-600" /> Student Access
        </h1>
        <p className="text-sm text-muted-foreground font-medium mt-1">
          Who bought what, change a student&apos;s recording, extend access, or revoke it.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Purchases" value={String(access.length)} />
        <Stat label="Active now" value={String(activeCount)} accent />
        <Stat label="Revenue (LKR)" value={revenue.toLocaleString()} />
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by student name, email or recording…"
          className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-slate-400 py-10 justify-center"><Loader2 className="animate-spin" size={18} /> Loading…</div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-400 py-12 text-center">
          {access.length === 0 ? 'No purchases yet.' : 'No matches for that search.'}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const valid = isAccessValid(a);
            const left = daysLeft(a);
            const exp = accessExpiryDate(a);
            return (
              <div key={a.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="font-black text-sm text-slate-800">{a.userName || 'Student'}</span>
                      <span className="text-xs text-slate-500">{a.userEmail}</span>
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        valid ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : a.status === 'suspended' ? 'bg-red-50 text-red-700 border-red-200'
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {valid ? 'Active' : a.status === 'suspended' ? 'Suspended' : 'Expired'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-semibold">{a.recordingTitle}</p>
                    <p className="text-[11px] text-slate-400 mt-1 inline-flex items-center gap-1">
                      <Clock size={11} />
                      {valid ? `${left} day${left === 1 ? '' : 's'} left` : 'No access'}
                      {exp && ` · expires ${exp.toLocaleDateString()}`}
                      {a.amountPaid ? ` · LKR ${a.amountPaid.toLocaleString()}` : a.grantedBy ? ' · granted by admin' : ''}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                    <button onClick={() => setMoving(a)} disabled={!!busy}
                      className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 inline-flex items-center gap-1">
                      <ArrowRightLeft size={12} /> Change
                    </button>
                    <button onClick={() => call({ action: 'extend', accessId: a.id, days: 30 }, 'Extended by 30 days')} disabled={!!busy}
                      className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                      <CalendarPlus size={12} /> +30d
                    </button>
                    {a.status === 'suspended' ? (
                      <button onClick={() => call({ action: 'setStatus', accessId: a.id, status: 'active' }, 'Access restored')} disabled={!!busy}
                        className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 size={12} /> Restore
                      </button>
                    ) : (
                      <button onClick={() => call({ action: 'setStatus', accessId: a.id, status: 'suspended' }, 'Access suspended')} disabled={!!busy}
                        className="text-[10px] font-black uppercase px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                        <Ban size={12} /> Suspend
                      </button>
                    )}
                    <button
                      onClick={() => { if (window.confirm(`Revoke ${a.userName || 'this student'}'s access to "${a.recordingTitle}"?`)) call({ action: 'revoke', accessId: a.id }, 'Access revoked'); }}
                      disabled={!!busy} aria-label="Revoke"
                      className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-600">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Change-recording picker */}
                {moving?.id === a.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-500 mb-2">Move this student to:</p>
                    <div className="flex flex-wrap gap-2">
                      {recordings.filter(r => r.id !== a.recordingId).map(r => (
                        <button
                          key={r.id}
                          onClick={() => call({ action: 'move', accessId: a.id, recordingId: r.id }, `Moved to "${r.title}"`)}
                          disabled={!!busy}
                          className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200"
                        >
                          {r.title} <span className="text-violet-400">· {monthLabel(r.month)} C{r.classNumber}</span>
                        </button>
                      ))}
                      <button onClick={() => setMoving(null)} className="text-[11px] font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className={`rounded-2xl border p-4 ${accent ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-slate-200'}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</p>
      <p className={`text-2xl font-black mt-0.5 ${accent ? 'text-emerald-600' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}
