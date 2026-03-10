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

export default function PaymentTransactionsPage() {
  const { user: currentUser, isUserLoading } = useUser();
  const { firestore } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();

  const [isAdmin, setIsAdmin] = useState(false);
  const [orders, setOrders] = useState<PaymentOrder[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<PaymentOrder[]>([]);
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
    const filtered = orders.filter(order =>
      order.orderId.toLowerCase().includes(lowercased) ||
      order.userId.toLowerCase().includes(lowercased) ||
      order.courseId.toLowerCase().includes(lowercased)
    );
    setFilteredOrders(filtered);
  }, [searchTerm, orders]);

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
            placeholder="Search by Order ID, User ID, or Course ID..."
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
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">User ID</th>
                    <th className="px-6 py-4 text-sm font-bold uppercase tracking-wider text-muted-foreground">Course</th>
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
                      <td className="px-6 py-4 text-sm text-muted-foreground truncate max-w-[150px]">{order.userId}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{order.courseId}</td>
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
