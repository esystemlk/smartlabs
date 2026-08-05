'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { useUser, useFirebase } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { listAllEnrollments } from '@/lib/services/recorded-packages.service';
import { type RecordedEnrollment, formatLkr, isEnrollmentValid, daysLeft } from '@/types/recorded-package';
import { phoneKey } from '@/lib/utils';
import {
  ArrowLeft, Loader2, Search, Wallet, Users, CalendarDays, Film,
  TrendingUp, X, Download,
} from 'lucide-react';

type Row = RecordedEnrollment & { phone: string; name: string; email: string; when: Date | null };

function toDate(v: unknown): Date | null {
  return (v as { toDate?: () => Date } | undefined)?.toDate?.() ?? null;
}

// Default period = current calendar month.
function monthRange(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { from: fmt(from), to: fmt(to) };
}

export default function RecordedPurchasesPage() {
  const { user, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();

  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [{ from, to }, setPeriod] = useState(monthRange());

  // Access guard
  useEffect(() => {
    if (isUserLoading) return;
    if (!user || !firestore) { router.push('/login'); return; }
    getDoc(doc(firestore, 'users', user.uid)).then(snap => {
      const role = snap.data()?.role;
      if (['admin', 'developer', 'teacher'].includes(role)) setAllowed(true);
      else router.push('/dashboard');
      setChecking(false);
    });
  }, [user, isUserLoading, firestore, router]);

  useEffect(() => {
    if (!allowed || !firestore) return;
    (async () => {
      setLoading(true);
      try {
        const [enr, usersSnap] = await Promise.all([
          listAllEnrollments(),
          getDocs(collection(firestore, 'users')),
        ]);
        const umap = new Map<string, { phone?: string; displayName?: string; email?: string }>();
        usersSnap.docs.forEach(d => umap.set(d.id, d.data() as { phone?: string; displayName?: string; email?: string }));
        setRows(enr.map(e => {
          const u = umap.get(e.userId) ?? {};
          return {
            ...e,
            name: e.userName || u.displayName || '—',
            email: e.userEmail || u.email || '—',
            phone: e.userPhone || u.phone || '',
            when: toDate(e.purchasedAt),
          };
        }));
      } catch (err) { console.error(err); } finally { setLoading(false); }
    })();
  }, [allowed, firestore]);

  // Period-filtered rows (by purchase date).
  const inPeriod = useMemo(() => {
    const f = from ? new Date(from + 'T00:00:00') : null;
    const t = to ? new Date(to + 'T23:59:59') : null;
    return rows.filter(r => {
      if (!r.when) return false;
      if (f && r.when < f) return false;
      if (t && r.when > t) return false;
      return true;
    });
  }, [rows, from, to]);

  // Search over the period rows (name OR contact number).
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return inPeriod;
    const qKey = phoneKey(q);
    return inPeriod.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.email.toLowerCase().includes(q) ||
      (qKey.length >= 3 && phoneKey(r.phone).includes(qKey))
    );
  }, [inPeriod, search]);

  const lifetime = useMemo(() => rows.reduce((s, r) => s + (r.amountPaid ?? 0), 0), [rows]);
  const periodEarnings = useMemo(() => inPeriod.reduce((s, r) => s + (r.amountPaid ?? 0), 0), [inPeriod]);
  const activeCount = useMemo(() => rows.filter(r => isEnrollmentValid(r)).length, [rows]);

  const exportCsv = () => {
    const header = 'Name,Contact,Email,Package,Amount,Purchased,Expires,Status\n';
    const body = visible.map(r => {
      const cells = [
        r.name, r.phone || '', r.email, r.packageTitle,
        String(r.amountPaid ?? ''),
        r.when ? r.when.toISOString().slice(0, 10) : '',
        toDate(r.expiresAt)?.toISOString().slice(0, 10) ?? '',
        isEnrollmentValid(r) ? 'active' : 'expired',
      ];
      return cells.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',');
    }).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `recorded_purchases_${from}_to_${to}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const preset = (kind: 'month' | '30d' | 'all') => {
    if (kind === 'month') setPeriod(monthRange());
    else if (kind === '30d') {
      const t = new Date(); const f = new Date(); f.setDate(f.getDate() - 30);
      setPeriod({ from: f.toISOString().slice(0, 10), to: t.toISOString().slice(0, 10) });
    } else setPeriod({ from: '2020-01-01', to: new Date().toISOString().slice(0, 10) });
  };

  if (checking || isUserLoading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }
  if (!allowed) return null;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between gap-2 px-4 py-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href="/admin/dashboard/recorded-packages"><Button variant="ghost" size="sm" className="gap-1.5"><ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Packages</span></Button></Link>
            <div className="flex items-center gap-2 min-w-0">
              <Wallet className="h-5 w-5 text-primary shrink-0" />
              <h1 className="text-base font-semibold truncate">Purchases &amp; Earnings</h1>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={exportCsv} className="gap-1.5"><Download className="h-4 w-4" /> <span className="hidden sm:inline">Export</span></Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 md:py-8 space-y-6">
        {/* Earnings cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          <StatCard icon={TrendingUp} tone="text-green-600 bg-green-500/10" label="Period earnings" value={formatLkr(periodEarnings)} sub={`${inPeriod.length} purchase${inPeriod.length === 1 ? '' : 's'}`} />
          <StatCard icon={Wallet} tone="text-primary bg-primary/10" label="Lifetime earnings" value={formatLkr(lifetime)} sub={`${rows.length} total`} />
          <StatCard icon={Users} tone="text-blue-600 bg-blue-500/10" label="Active students" value={String(activeCount)} sub="valid access" />
          <StatCard icon={Film} tone="text-rose-600 bg-rose-500/10" label="Expired" value={String(rows.length - activeCount)} sub="need renewal" />
        </div>

        {/* Controls */}
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">From</label>
              <input type="date" value={from} onChange={e => setPeriod(p => ({ ...p, from: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">To</label>
              <input type="date" value={to} onChange={e => setPeriod(p => ({ ...p, to: e.target.value }))} className="rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => preset('month')}>This month</Button>
              <Button size="sm" variant="secondary" onClick={() => preset('30d')}>Last 30 days</Button>
              <Button size="sm" variant="secondary" onClick={() => preset('all')}>All time</Button>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by student name or contact number…"
              className="w-full rounded-lg border bg-background pl-9 pr-9 py-2 text-sm outline-none focus:border-primary" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><X className="h-4 w-4" /></button>}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center gap-2 text-muted-foreground py-12 justify-center"><Loader2 className="h-4 w-4 animate-spin" /> Loading purchases…</div>
        ) : visible.length === 0 ? (
          <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">
            {rows.length === 0 ? 'No recorded-session purchases yet.' : 'No purchases match your filters.'}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-sm min-w-[720px]">
              <thead>
                <tr className="bg-muted/50 text-left text-xs text-muted-foreground">
                  <th className="p-3 font-semibold">Student</th>
                  <th className="p-3 font-semibold">Contact</th>
                  <th className="p-3 font-semibold">Package</th>
                  <th className="p-3 font-semibold text-right">Amount</th>
                  <th className="p-3 font-semibold">Purchased</th>
                  <th className="p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {visible.map(r => {
                  const valid = isEnrollmentValid(r);
                  return (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="p-3">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs text-muted-foreground">{r.email}</div>
                      </td>
                      <td className="p-3">{r.phone || <span className="text-muted-foreground">—</span>}</td>
                      <td className="p-3">{r.packageTitle}</td>
                      <td className="p-3 text-right font-semibold text-green-600">{r.amountPaid ? formatLkr(r.amountPaid) : '—'}</td>
                      <td className="p-3 whitespace-nowrap">{r.when ? r.when.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</td>
                      <td className="p-3">
                        {valid
                          ? <Badge className="bg-green-500/15 text-green-600">Active · {daysLeft(r)}d left</Badge>
                          : <Badge className="bg-slate-500/15 text-slate-500">Expired</Badge>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Showing {visible.length} of {rows.length} purchases · Period earnings reflect purchases between the selected dates.</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, tone, label, value, sub }: { icon: React.ElementType; tone: string; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${tone}`}><Icon className="h-4 w-4" /></div>
      <p className="text-xl font-extrabold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
      {sub && <p className="text-[11px] text-muted-foreground/70">{sub}</p>}
    </div>
  );
}
