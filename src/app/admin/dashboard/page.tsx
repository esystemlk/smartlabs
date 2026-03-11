'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useAuth, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOut } from 'firebase/auth';
import { LogOut, Users, UserCog, MessageSquare, GraduationCap, FileText, Library, DollarSign, UserCheck, Home, LayoutDashboard, Sparkles, Video, Brain, Presentation } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import Image from 'next/image';

// ... (previous content was mostly correct, I just need to restore the card and correct icons)

export default function AdminDashboardPage() {
    const { user: currentUser, isUserLoading } = useUser();
    const auth = useAuth();
    const { firestore } = useFirebase();
    const router = useRouter();

    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUserRole, setCurrentUserRole] = useState('');

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

    const navItems = [
        { title: "Total Users", value: users?.length ?? 0, desc: "Live count of registered users.", icon: Users, href: null },
        { title: "User Management", value: "Manage", desc: "Manage roles and access.", icon: UserCog, href: "/admin/dashboard/users" },
        { title: "Course Management", value: "Manage", desc: "Add, edit, or delete courses.", icon: GraduationCap, href: "/admin/dashboard/courses" },
        { title: "Enrollments", value: "Verify", desc: "Approve new student enrollments.", icon: UserCheck, href: "/admin/dashboard/enrollments" },
        { title: "Payment Settings", value: "Configure", desc: "Set PayHere links and prices.", icon: DollarSign, href: "/admin/dashboard/payments/settings" },
        { title: "Resource Library", value: "Manage", desc: "Add and organize materials.", icon: Library, href: "/admin/dashboard/resources" },
        { title: "Blog Management", value: "Manage", desc: "Create and edit blog posts.", icon: FileText, href: "/admin/dashboard/blog" },
        { title: "Support Center", value: "Open", desc: "Manage student queries.", icon: MessageSquare, href: "/admin/dashboard/support" },
        { title: "Payment History", value: "View All", desc: "Browse successful transactions.", icon: DollarSign, href: "/admin/dashboard/payments" },
        { title: "Event Management", value: "Manage", desc: "Manage popups & events.", icon: Sparkles, href: "/admin/dashboard/events", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
        { title: "Session Manager", value: "Zoom Links", desc: "Manage active session links.", icon: Video, href: "/admin/dashboard/sessions", color: "text-accent-3", bg: "bg-accent-3/5", border: "border-accent-3/20" },
        { title: "Level Test Results", value: "Reports", desc: "Review student diagnostics.", icon: Brain, href: "/admin/dashboard/level-tests", color: "text-primary", bg: "bg-primary/5", border: "border-primary/20" },
        { title: "Webinar Management", value: "Manage", desc: "Manage webinar registrations.", icon: Presentation, href: "/admin/dashboard/webinars", color: "text-blue-500", bg: "bg-blue-500/5", border: "border-blue-500/20" },
        { title: "Student Dashboard", value: "Go To", desc: "Switch to student view.", icon: LayoutDashboard, href: "/dashboard" },
        { title: "Main Website", value: "Go To", desc: "View the public homepage.", icon: Home, href: "/" },
    ];

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
                        {navItems.map((item, idx) => (
                            <Card key={idx} className={`transition-colors ${item.href ? 'hover:bg-muted/50 cursor-pointer' : ''} ${item.bg || ''} ${item.border || ''}`}>
                                {item.href ? (
                                    <Link href={item.href}>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                                            <item.icon className={`h-4 w-4 ${item.color || 'text-muted-foreground'}`} />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{item.value}</div>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </CardContent>
                                    </Link>
                                ) : (
                                    <>
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">{item.title}</CardTitle>
                                            <item.icon className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">{item.value}</div>
                                            <p className="text-xs text-muted-foreground">{item.desc}</p>
                                        </CardContent>
                                    </>
                                )}
                            </Card>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}
