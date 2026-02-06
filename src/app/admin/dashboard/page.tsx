
'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LogOut, Users, UserCog, MessageSquare, GraduationCap, FileText, Library, DollarSign, UserCheck, Home, LayoutDashboard, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

export default function AdminDashboardPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const auth = useAuth();
    const { firestore } = useFirebase();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('');

    // Fetch all users from the 'users' collection for the count
    const usersQuery = useMemoFirebase(() =>
        firestore ? collection(firestore, 'users') : null,
        [firestore]
    );
    const { data: users, isLoading: usersLoading } = useCollection(usersQuery);

    useEffect(() => {
        if (!isUserLoading && currentUser && firestore) {
            const userRef = doc(firestore, 'users', currentUser.uid);
            getDoc(userRef).then(userDoc => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    const role = userData.role;
                    setCurrentUserRole(role);
                    if (role === 'admin' || role === 'developer' || role === 'teacher') {
                        setIsAdmin(true);
                    } else {
                        router.push('/dashboard'); // Redirect non-admins/teachers to student dashboard
                    }
                } else {
                    router.push('/login'); // If user doc doesn't exist, they shouldn't be here
                }
            });
        } else if (!isUserLoading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, isUserLoading, router, firestore]);

    const handleLogout = async () => {
        if (!auth) return;
        await signOut(auth);
        router.push('/login');
    };

    if (isUserLoading || !isAdmin) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center flex flex-col items-center gap-4">
                    <Image src="/logo.png" alt="Smart Labs Logo" width={80} height={80} className="animate-pulse-glow" />
                    <p className="text-lg font-semibold">Verifying Access...</p>
                    <p className="text-sm text-muted-foreground">Please wait while we check your credentials.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen">
            <section className="py-8 md:py-12">
                <div className="container mx-auto">
                    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-headline font-bold">Admin Dashboard</h1>
                                <p className="text-md text-muted-foreground mt-1">Welcome back, {currentUser?.displayName || 'Admin'}!</p>
                            </div>
                            {currentUserRole && <Badge variant="destructive" className="capitalize">{currentUserRole}</Badge>}
                        </div>
                        <Button onClick={handleLogout} variant="outline">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </header>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{users?.length ?? 0}</div>
                                <p className="text-xs text-muted-foreground">Live count of registered users.</p>
                            </CardContent>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/users">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">User Management</CardTitle>
                                    <UserCog className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage</div>
                                    <p className="text-xs text-muted-foreground">Manage roles and access.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/courses">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Course Management</CardTitle>
                                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage</div>
                                    <p className="text-xs text-muted-foreground">Add, edit, or delete courses.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/enrollments">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Enrollments</CardTitle>
                                    <UserCheck className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Verify</div>
                                    <p className="text-xs text-muted-foreground">Approve new student enrollments.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/resources">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Resource Library</CardTitle>
                                    <Library className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage</div>
                                    <p className="text-xs text-muted-foreground">Add and organize materials.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/blog">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Blog Management</CardTitle>
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage</div>
                                    <p className="text-xs text-muted-foreground">Create and edit blog posts.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/support">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Support Center</CardTitle>
                                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Open</div>
                                    <p className="text-xs text-muted-foreground">Manage student queries.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/admin/dashboard/payments">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Payment History</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">View All</div>
                                    <p className="text-xs text-muted-foreground">Browse successful transactions.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors border-primary/20 bg-primary/5">
                            <Link href="/admin/dashboard/events">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Event Management</CardTitle>
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Manage</div>
                                    <p className="text-xs text-muted-foreground">Manage popups & events.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/dashboard">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Student Dashboard</CardTitle>
                                    <LayoutDashboard className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Go To</div>
                                    <p className="text-xs text-muted-foreground">Switch to student view.</p>
                                </CardContent>
                            </Link>
                        </Card>
                        <Card className="hover:bg-muted/50 transition-colors">
                            <Link href="/">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Main Website</CardTitle>
                                    <Home className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">Go To</div>
                                    <p className="text-xs text-muted-foreground">View the public homepage.</p>
                                </CardContent>
                            </Link>
                        </Card>
                    </div>
                </div>
            </section>
        </div>
    );
}
