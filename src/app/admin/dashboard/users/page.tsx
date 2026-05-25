'use client';

import { useMemo } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, UserCheck, UserX, UserCog, ArrowLeft, CreditCard, RefreshCw, Star } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { collection } from 'firebase/firestore';
import { errorEmitter, FirestorePermissionError } from '@/firebase';

export default function UserManagementPage() {
  const { user: currentUser } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const usersQuery = useMemoFirebase(() =>
    firestore ? collection(firestore, 'users') : null,
    [firestore]
  );
  const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

  const handleAddCredits = async (
    targetUid: string,
    action: 'add_paid' | 'set_monthly' | 'reset',
    amount?: number,
    monthlyDays?: number
  ) => {
    if (!currentUser) return;
    try {
      const idToken = await currentUser.getIdToken();
      const res = await fetch('/api/admin/manage-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
        body: JSON.stringify({ targetUid, action, amount, monthlyDays }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast({ title: 'Credits Updated', description: data.message });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      toast({ variant: 'destructive', title: 'Error', description: msg });
    }
  };

  const handleRoleChange = (userId: string, newRole: 'user' | 'teacher' | 'admin' | 'developer') => {
    if (!firestore || !currentUser) return;
    
    if(userId === currentUser.uid) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: "You cannot change your own role.",
        });
        return;
    }

    const userRef = doc(firestore, 'users', userId);
    const updatedData = { role: newRole };

    updateDoc(userRef, updatedData)
      .then(() => {
        toast({
          title: 'Success!',
          description: `User role has been updated to ${newRole}.`,
        });
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
            path: userRef.path,
            operation: 'update',
            requestResourceData: updatedData
        });
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  return (
    <div className="w-full min-h-screen">
      <section className="py-8 md:py-12">
        <div className="container mx-auto">
           <Button asChild variant="ghost" className="mb-4">
             <Link href="/admin/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard</Link>
          </Button>
          <Card>
            <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View, manage roles, and monitor all users on the platform.</CardDescription>
            </CardHeader>
            <CardContent>
                {usersLoading ? <p>Loading users...</p> : (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Essay Credits</TableHead>
                            <TableHead>
                                <span className="sr-only">Actions</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users && users.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="hidden h-9 w-9 sm:flex">
                                            <AvatarImage src={user.photoURL || `https://picsum.photos/seed/${user.id}/100/100`} alt="Avatar" />
                                            <AvatarFallback>{user.displayName?.charAt(0) || user.email.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="grid gap-1">
                                            <p className="text-sm font-medium leading-none">{user.displayName || 'No Name'}</p>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>{user.email}</TableCell>
                                <TableCell>
                                    <Badge variant={user.role === 'admin' || user.role === 'developer' ? 'destructive' : user.role === 'teacher' ? 'secondary' : 'outline'} className="capitalize">{user.role || 'user'}</Badge>
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {['admin','developer','teacher'].includes(user.role)
                                    ? <Badge variant="secondary" className="text-xs">Unlimited</Badge>
                                    : user.essayMonthlyExpiry && new Date(user.essayMonthlyExpiry?.toDate?.() ?? 0) > new Date()
                                      ? <Badge className="text-xs bg-violet-100 text-violet-700 border-violet-200 hover:bg-violet-100">Monthly ✓</Badge>
                                      : user.essayPaidCredits > 0
                                        ? <Badge variant="outline" className="text-xs">{user.essayPaidCredits} paid</Badge>
                                        : <span className="text-[11px]">Free: {2 - Math.min(2, user.essayFreeUsed ?? 0)} left</span>
                                  }
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button aria-haspopup="true" size="icon" variant="ghost" disabled={user.id === currentUser?.uid}>
                                                <MoreHorizontal className="h-4 w-4" />
                                                <span className="sr-only">Toggle menu</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuLabel>Manage User</DropdownMenuLabel>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'teacher')}><UserCog className="mr-2 h-4 w-4" /> Make Teacher</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'admin')}><Shield className="mr-2 h-4 w-4" /> Make Admin</DropdownMenuItem>
                                             <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'developer')}><UserCog className="mr-2 h-4 w-4" /> Make Developer</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleRoleChange(user.id, 'user')}><UserCheck className="mr-2 h-4 w-4" /> Make Student</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuLabel className="text-xs text-muted-foreground">Essay Credits</DropdownMenuLabel>
                                            <DropdownMenuItem onClick={() => handleAddCredits(user.id, 'add_paid', 10)}><CreditCard className="mr-2 h-4 w-4 text-blue-500" /> Add 10 Credits ($3)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAddCredits(user.id, 'add_paid', 20)}><CreditCard className="mr-2 h-4 w-4 text-emerald-500" /> Add 20 Credits ($5)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAddCredits(user.id, 'add_paid', 40)}><CreditCard className="mr-2 h-4 w-4 text-violet-500" /> Add 40 Credits ($10)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAddCredits(user.id, 'set_monthly', undefined, 30)}><Star className="mr-2 h-4 w-4 text-amber-500" /> Monthly Plan (30 days)</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleAddCredits(user.id, 'reset')}><RefreshCw className="mr-2 h-4 w-4 text-slate-500" /> Reset Essay Credits</DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-red-600 focus:text-red-500"><UserX className="mr-2 h-4 w-4" /> Suspend User</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
