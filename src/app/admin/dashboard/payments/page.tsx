
'use client';

import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function PaymentsHistoryPage() {
  const { firestore } = useFirebase();

  const paymentsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'payments'), orderBy('paymentTimestamp', 'desc')) : null),
    [firestore]
  );
  const { data: payments, isLoading: paymentsLoading } = useCollection(paymentsQuery);

  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const userMap = useMemo(() => {
    if (!users) return new Map();
    return new Map(users.map(user => [user.id, user]));
  }, [users]);
  
  const isLoading = paymentsLoading || usersLoading;

  const renderSkeleton = () => (
    Array.from({ length: 5 }).map((_, i) => (
        <TableRow key={i}>
            <TableCell>
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="grid gap-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </div>
            </TableCell>
            <TableCell><Skeleton className="h-6 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell><Skeleton className="h-4 w-36" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto">
          <Button asChild variant="ghost" className="mb-4">
             <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <DollarSign className="h-8 w-8 text-primary" />
                <div>
                    <CardTitle>Payment History</CardTitle>
                    <CardDescription>A log of all successful transactions.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Order ID</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? renderSkeleton() : (
                        payments?.map((payment) => {
                        const user = userMap.get(payment.userId);
                        const courseId = (payment.orderId as string).split('__')[1] || 'Unknown';
                        return (
                            <TableRow key={payment.id}>
                            <TableCell>
                                <div className="flex items-center gap-3">
                                    <Avatar className="hidden h-9 w-9 sm:flex">
                                        <AvatarImage src={user?.photoURL || `https://picsum.photos/seed/${payment.userId}/100/100`} alt="Avatar" />
                                        <AvatarFallback>{user?.displayName?.charAt(0) || 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div className="grid gap-1">
                                        <p className="text-sm font-medium leading-none">{user?.displayName || 'Unknown User'}</p>
                                        <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell><Badge variant="secondary">{courseId}</Badge></TableCell>
                            <TableCell>{payment.currency} {payment.amount}</TableCell>
                            <TableCell>{payment.paymentTimestamp?.toDate().toLocaleString()}</TableCell>
                            <TableCell className="font-mono">{payment.orderId}</TableCell>
                            </TableRow>
                        );
                        })
                    )}
                  </TableBody>
                </Table>
              { !isLoading && payments?.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                  No payment records found.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
