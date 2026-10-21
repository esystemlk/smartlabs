'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  ChevronLeft,
  Sparkles,
  Loader2,
  AlertCircle,
  Search,
  Download,
  TrendingUp,
  Receipt,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
  subWeeks,
  subMonths,
  subYears,
  isAfter,
} from 'date-fns';

// All Firestore `payment_orders.type` values that represent an AI-credit
// purchase (essay/speaking/SST/SWT scoring, universal pool, mock tests).
// Keep in sync with each api/*-credits/create-payment route's `type:` literal.
const AI_CREDIT_LABELS: Record<string, string> = {
  universal_credits: 'Universal AI Credits',
  essay_credits: 'PTE Essay Credits',
  ielts_essay_credits: 'IELTS Essay Credits',
  speaking_credits: 'Speaking Credits',
  sst_credits: 'Summarize Spoken Text',
  swt_credits: 'Summarize Written Text',
  mock_credits: 'PTE Mock Test Credits',
  ielts_mock_credits: 'IELTS Mock Test Credits',
};
const AI_CREDIT_TYPES = Object.keys(AI_CREDIT_LABELS);

type Granularity = 'weekly' | 'monthly' | 'yearly';

interface CreditOrder {
  id: string;
  userId: string;
  orderId: string;
  type: string;
  packageId?: string;
  paymentAmount: number;
  paymentStatus: string;
  createdAt: Date;
}

function toDate(value: any): Date {
  if (!value) return new Date(0);
  if (typeof value.toDate === 'function') return value.toDate();
  if (typeof value.seconds === 'number') return new Date(value.seconds * 1000);
  return new Date(value);
}

function bucketKey(date: Date, granularity: Granularity): { key: string; label: string; start: Date } {
  if (granularity === 'weekly') {
    const start = startOfWeek(date, { weekStartsOn: 1 });
    return { key: start.toISOString(), label: format(start, 'MMM d'), start };
  }
  if (granularity === 'monthly') {
    const start = startOfMonth(date);
    return { key: start.toISOString(), label: format(start, 'MMM yyyy'), start };
  }
  const start = startOfYear(date);
  return { key: start.toISOString(), label: format(start, 'yyyy'), start };
}

function periodStart(granularity: Granularity, now: Date): Date {
  if (granularity === 'weekly') return startOfWeek(now, { weekStartsOn: 1 });
  if (granularity === 'monthly') return startOfMonth(now);
  return startOfYear(now);
}

function trendWindowStart(granularity: Granularity, now: Date): Date {
  if (granularity === 'weekly') return subWeeks(now, 11);
  if (granularity === 'monthly') return subMonths(now, 11);
  return subYears(now, 4);
}

export default function AiCreditsEarningsPage() {
  const [orders, setOrders] = useState<CreditOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [granularity, setGranularity] = useState<Granularity>('monthly');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      setError(false);
      try {
        const q = query(collection(db, 'payment_orders'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        const successfulAiOrders = snapshot.docs
          .map(docSnap => {
            const data = docSnap.data();
            return {
              id: docSnap.id,
              userId: data.userId ?? '',
              orderId: data.orderId ?? docSnap.id,
              type: data.type ?? '',
              packageId: data.packageId,
              paymentAmount: Number(data.paymentAmount) || 0,
              paymentStatus: data.paymentStatus ?? 'pending',
              createdAt: toDate(data.createdAt),
            } as CreditOrder;
          })
          // Only successful payments, and only AI-credit purchase types —
          // course enrolments, recorded packages etc. live in the same
          // collection and are excluded here.
          .filter(o => o.paymentStatus === 'success' && AI_CREDIT_TYPES.includes(o.type));
        setOrders(successfulAiOrders);
      } catch (err) {
        console.error('Error loading AI credit earnings:', err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const filteredOrders = useMemo(() => {
    const lowered = searchTerm.toLowerCase().trim();
    if (!lowered) return orders;
    return orders.filter(o =>
      o.orderId.toLowerCase().includes(lowered) ||
      o.userId.toLowerCase().includes(lowered) ||
      (AI_CREDIT_LABELS[o.type] ?? o.type).toLowerCase().includes(lowered)
    );
  }, [orders, searchTerm]);

  const now = useMemo(() => new Date(), []);

  const currentPeriodTotal = useMemo(() => {
    const start = periodStart(granularity, now);
    return orders.filter(o => isAfter(o.createdAt, start) || o.createdAt.getTime() === start.getTime())
      .reduce((sum, o) => sum + o.paymentAmount, 0);
  }, [orders, granularity, now]);

  const currentPeriodCount = useMemo(() => {
    const start = periodStart(granularity, now);
    return orders.filter(o => isAfter(o.createdAt, start) || o.createdAt.getTime() === start.getTime()).length;
  }, [orders, granularity, now]);

  const trendData = useMemo(() => {
    const windowStart = trendWindowStart(granularity, now);
    const buckets = new Map<string, { label: string; start: Date; total: number; count: number }>();
    for (const o of orders) {
      if (!isAfter(o.createdAt, windowStart)) continue;
      const { key, label, start } = bucketKey(o.createdAt, granularity);
      const existing = buckets.get(key) ?? { label, start, total: 0, count: 0 };
      existing.total += o.paymentAmount;
      existing.count += 1;
      buckets.set(key, existing);
    }
    return Array.from(buckets.values()).sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [orders, granularity, now]);

  const totalAllTime = useMemo(() => orders.reduce((sum, o) => sum + o.paymentAmount, 0), [orders]);

  const byType = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    for (const o of orders) {
      const existing = map.get(o.type) ?? { total: 0, count: 0 };
      existing.total += o.paymentAmount;
      existing.count += 1;
      map.set(o.type, existing);
    }
    return Array.from(map.entries())
      .map(([type, v]) => ({ type, label: AI_CREDIT_LABELS[type] ?? type, ...v }))
      .sort((a, b) => b.total - a.total);
  }, [orders]);

  const formatPrice = (amount: number) =>
    new Intl.NumberFormat('en-LK', { style: 'currency', currency: 'LKR', maximumFractionDigits: 0 }).format(amount);

  const periodLabel = granularity === 'weekly' ? 'This week' : granularity === 'monthly' ? 'This month' : 'This year';

  const exportCsv = () => {
    const header = ['Order ID', 'User ID', 'Credit type', 'Amount (LKR)', 'Date'];
    const rows = filteredOrders.map(o => [
      o.orderId,
      o.userId,
      AI_CREDIT_LABELS[o.type] ?? o.type,
      o.paymentAmount.toString(),
      o.createdAt.toISOString(),
    ]);
    const csv = [header, ...rows].map(r => r.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-credits-earnings-${granularity}-${format(now, 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <header className="mb-8">
        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              AI Credits Earnings
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">Successful AI-credit payments only — pending and failed orders are excluded.</p>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <AlertCircle className="h-5 w-5 shrink-0" />
          Failed to load earnings data. Refresh the page to try again.
        </div>
      )}

      <Tabs value={granularity} onValueChange={v => setGranularity(v as Granularity)} className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-xl">
          <TabsTrigger value="weekly" className="rounded-lg">Weekly</TabsTrigger>
          <TabsTrigger value="monthly" className="rounded-lg">Monthly</TabsTrigger>
          <TabsTrigger value="yearly" className="rounded-lg">Yearly</TabsTrigger>
        </TabsList>

        <TabsContent value={granularity} className="space-y-6 mt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Wallet className="h-4 w-4" />{periodLabel}</CardDescription>
                <CardTitle className="text-2xl">{formatPrice(currentPeriodTotal)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{currentPeriodCount} successful payment{currentPeriodCount === 1 ? '' : 's'}</CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><TrendingUp className="h-4 w-4" />All-time total</CardDescription>
                <CardTitle className="text-2xl">{formatPrice(totalAllTime)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">{orders.length} successful payment{orders.length === 1 ? '' : 's'}</CardContent>
            </Card>
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-2"><Receipt className="h-4 w-4" />Average order</CardDescription>
                <CardTitle className="text-2xl">{formatPrice(orders.length ? totalAllTime / orders.length : 0)}</CardTitle>
              </CardHeader>
              <CardContent className="text-xs text-muted-foreground">Across all successful AI-credit orders</CardContent>
            </Card>
          </div>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">
                {granularity === 'weekly' ? 'Last 12 weeks' : granularity === 'monthly' ? 'Last 12 months' : 'Last 5 years'}
              </CardTitle>
              <CardDescription>Successful AI-credit earnings only</CardDescription>
            </CardHeader>
            <CardContent>
              {trendData.length === 0 ? (
                <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">No successful payments in this range yet.</div>
              ) : (
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `${Math.round(v / 1000)}k`} />
                      <Tooltip formatter={(value: number) => formatPrice(value)} />
                      <Bar dataKey="total" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">By credit type</CardTitle>
              <CardDescription>All-time, successful payments only</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {byType.length === 0 ? (
                <p className="text-sm text-muted-foreground">No successful AI-credit payments yet.</p>
              ) : byType.map(t => (
                <div key={t.type} className="flex items-center justify-between rounded-xl border border-border/40 px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold">{t.label}</div>
                    <div className="text-xs text-muted-foreground">{t.count} order{t.count === 1 ? '' : 's'}</div>
                  </div>
                  <div className="text-sm font-bold text-primary">{formatPrice(t.total)}</div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex flex-col md:flex-row gap-4 my-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by Order ID, User ID, or credit type..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl px-6" onClick={exportCsv}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/10 py-4">
          <CardTitle className="text-xl">Successful transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No successful AI-credit transactions found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/20 border-b border-border/10">
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Order ID</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">User ID</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Credit type</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map(order => (
                    <tr key={order.id} className="border-b border-border/5 hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-mono font-medium">{order.orderId}</td>
                      <td className="px-6 py-4 text-xs font-mono text-muted-foreground">{order.userId}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{AI_CREDIT_LABELS[order.type] ?? order.type}</td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">{formatPrice(order.paymentAmount)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{order.createdAt.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
