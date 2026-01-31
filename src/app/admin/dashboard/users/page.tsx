'use client';

import { useMemo } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, Shield, UserCheck, UserX, UserCog, ArrowLeft } from 'lucide-react';
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
