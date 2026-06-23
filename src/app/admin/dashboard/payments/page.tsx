'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFirebase, useUser } from '@/firebase';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft,
  CreditCard,
  AlertCircle,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Download,
  Eye
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { paymentService, PaymentOrder } from '@/lib/services/payment.service';

// Free-tier limits (kept in sync with the score-essay / score-swt routes)
const FREE_ESSAY_LIMIT = 2;
const FREE_SWT_LIMIT = 2;

interface CreditBalance {
  essay: { free: number; paid: number; gen: number; monthlyActive: boolean };
  swt: { free: number; paid: number; monthlyActive: boolean };
}

/**
 * Per-user available-credit breakdown — mirrors the AI Usage page.
 * Green = free credits left · Purple = bought · Blue = essay gen · Amber = monthly subscription
 */
function CreditCell({ credits }: { credits: CreditBalance | null }) {
  if (!credits) return <span className="text-muted-foreground text-[11px] italic">—</span>;

  const Line = ({ label, free, paid, gen, monthly }: {
    label: string; free: number; paid: number; gen?: number; monthly: boolean;
  }) => (
    <div className="flex items-center gap-1 flex-wrap">
      <span className="w-9 shrink-0 text-[10px] font-semibold text-muted-foreground uppercase">{label}</span>
      {monthly && (
        <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 text-[10px] font-bold" title="Active monthly subscription — unlimited">∞ Monthly</span>
      )}
      <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 text-[10px] font-mono" title="Free credits remaining (free tier)">{free} free</span>
      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${paid > 0 ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`} title="Paid credits remaining (bought)">{paid} bought</span>
      {gen !== undefined && gen > 0 && (
        <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[10px] font-mono" title="Essay generation credits">{gen} gen</span>
      )}
    </div>
  );

  return (
    <div className="space-y-1">
      <Line label="Essay" free={credits.essay.free} paid={credits.essay.paid} gen={credits.essay.gen} monthly={credits.essay.monthlyActive} />
      <Line label="SWT" free={credits.swt.free} paid={credits.swt.paid} monthly={credits.swt.monthlyActive} />
    </div>
  );
}

export default function PaymentTransactionsPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PaymentOrder[]>([]);
  const [userMap, setUserMap] = useState<Record<string, { name: string; email: string; credits: CreditBalance | null }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isUserLoading && currentUser && firestore) {
      const userRef = doc(firestore, 'users', currentUser.uid);
      getDoc(userRef).then(userDoc => {
        if (userDoc.exists()) {
          const role = userDoc.data().role;
          if (role === 'admin' || role === 'developer' || role === 'teacher') {
            setIsAdmin(true);
            loadData();
          } else {
            router.push('/dashboard');
          }
        } else {
          router.push('/login');
        }
      });
    } else if (!isUserLoading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, isUserLoading, router, firestore]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchedOrders = await paymentService.getPaymentOrders();
      setOrders(fetchedOrders);
      setFilteredOrders(fetchedOrders);

      // Resolve user names/emails for the unique userIds in these orders
      const uniqueUids = Array.from(new Set(fetchedOrders.map(o => o.userId).filter(Boolean)));
      const resolved = await Promise.all(
        uniqueUids.map(async uid => {
          try {
            const snap = await getDoc(doc(db, 'users', uid));
            const d: any = snap.exists() ? snap.data() : {};
            const now = new Date();
            const essayMonthly = d?.essayMonthlyExpiry?.toDate?.() ?? null;
            const swtMonthly = d?.swtMonthlyExpiry?.toDate?.() ?? null;
            const credits: CreditBalance | null = snap.exists() ? {
              essay: {
                free: Math.max(0, FREE_ESSAY_LIMIT - ((d?.essayFreeUsed as number) ?? 0)),
                paid: (d?.essayPaidCredits as number) ?? 0,
                gen: (d?.essayGenCredits as number) ?? 0,
                monthlyActive: !!(essayMonthly && essayMonthly > now),
              },
              swt: {
                free: Math.max(0, FREE_SWT_LIMIT - ((d?.swtFreeUsed as number) ?? 0)),
                paid: (d?.swtPaidCredits as number) ?? 0,
                monthlyActive: !!(swtMonthly && swtMonthly > now),
              },
            } : null;
            return [uid, {
              name: (d?.displayName as string) || (d?.name as string) || '',
              email: (d?.email as string) || '',
              credits,
            }] as const;
          } catch {
            return [uid, { name: '', email: '', credits: null }] as const;
          }
        })
      );
      setUserMap(Object.fromEntries(resolved));
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load payment transactions.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const lowercased = searchTerm.toLowerCase();
    const filtered = orders.filter(order => {
      const u = userMap[order.userId];
      return order.orderId.toLowerCase().includes(lowercased) ||
        order.userId.toLowerCase().includes(lowercased) ||
        order.courseId.toLowerCase().includes(lowercased) ||
        (u?.name ?? '').toLowerCase().includes(lowercased) ||
        (u?.email ?? '').toLowerCase().includes(lowercased);
    });
    setFilteredOrders(filtered);
  }, [searchTerm, orders, userMap]);

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-LK', {
      style: 'currency',
      currency: 'LKR',
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp.seconds * 1000);
    return date.toLocaleString();
  };

  const getStatusVariant = (status: PaymentOrder['paymentStatus']) => {
    switch (status) {
      case 'success': return 'default';
      case 'pending': return 'secondary';
      case 'failed': return 'destructive';
      case 'cancelled': return 'outline';
      default: return 'outline';
    }
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 md:px-0">
      <header className="mb-10">
        <Link href="/admin/dashboard" className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1 mb-4 transition-colors">
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-headline font-bold">Payment Transactions</h1>
            <p className="text-muted-foreground mt-1 text-lg">Monitor all payment attempts and successful enrollments.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, Order ID, User ID, or Course ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 rounded-xl"
          />
        </div>
        <Button variant="outline" className="h-11 rounded-xl px-6">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <Card className="rounded-2xl overflow-hidden border-border/50 shadow-sm">
        <CardHeader className="bg-muted/30 border-b border-border/10 py-4">
          <CardTitle className="text-xl flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Live Transaction Logs
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredOrders.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions found matching your search.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-muted/20 border-b border-border/10">
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">#</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Order ID</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">User</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Course</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Available Credits</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Amount</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Date</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, idx) => (
                    <tr key={order.id} className="border-b border-border/5 hover:bg-muted/10 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium">{idx + 1}</td>
                      <td className="px-6 py-4 text-sm font-mono font-medium">{order.orderId}</td>
                      <td className="px-6 py-4 text-sm max-w-[200px]">
                        <div className="font-semibold text-foreground truncate">
                          {userMap[order.userId]?.name?.trim() || <span className="font-normal text-muted-foreground italic">Unknown user</span>}
                        </div>
                        {userMap[order.userId]?.email && (
                          <div className="text-xs text-muted-foreground truncate">{userMap[order.userId].email}</div>
                        )}
                        <div className="text-[10px] text-muted-foreground/70 font-mono truncate" title={order.userId}>{order.userId}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold">{order.courseId}</td>
                      <td className="px-6 py-4"><CreditCell credits={userMap[order.userId]?.credits ?? null} /></td>
                      <td className="px-6 py-4 text-sm font-bold text-primary">{formatPrice(order.paymentAmount)}</td>
                      <td className="px-6 py-4">
                        <Badge variant={getStatusVariant(order.paymentStatus)} className="capitalize px-3 py-1 rounded-full text-[10px] tracking-wider">
                          {order.paymentStatus === 'success' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                          {order.paymentStatus === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {(order.paymentStatus === 'failed' || order.paymentStatus === 'cancelled') && <XCircle className="h-3 w-3 mr-1" />}
                          {order.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground whitespace-nowrap">{formatDate(order.createdAt)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-primary/10">
                          <Eye className="h-4 w-4 text-primary" />
                        </Button>
                      </td>
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
