'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, getDoc, collection } from 'firebase/firestore';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { ChevronRight, ListVideo, FileText, BookOpen, BarChart3, Calendar, MessageSquare, Briefcase, GraduationCap, Clock, Home, BookCheck, Check, Globe } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const lmsFeatures = [
    { title: 'Video Gallery', description: 'Watch our latest educational videos and updates.', href: '/videos', icon: ListVideo, color: "text-red-500", bg: "bg-red-500/10", border: "hover:border-red-500/50", gradient: "from-red-500/20 to-transparent" },
    { title: 'Practice Test Area', description: 'Access the AI Scoring Engine and practice materials.', href: '/dashboard/practice-tests', icon: BookOpen, color: "text-purple-500", bg: "bg-purple-500/10", border: "hover:border-purple-500/50", gradient: "from-purple-500/20 to-transparent" },
    { title: 'Smart Connect Portal', description: 'Login to the main student management system.', href: 'https://portal.smartlabs.lk', icon: Globe, color: "text-blue-500", bg: "bg-blue-500/10", border: "hover:border-blue-500/50", gradient: "from-blue-500/20 to-transparent" },
    { title: 'Support Chat', description: 'Get help from our support team.', href: '/dashboard/support', icon: MessageSquare, color: "text-cyan-500", bg: "bg-cyan-500/10", border: "hover:border-cyan-500/50", gradient: "from-cyan-500/20 to-transparent" },
    { title: 'Back to Homepage', description: 'Return to the main website.', href: '/', icon: Home, color: "text-gray-500", bg: "bg-gray-500/10", border: "hover:border-gray-500/50", gradient: "from-gray-500/20 to-transparent" },
];


export default function DashboardPage() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();
    const [userRole, setUserRole] = useState('');

    const enrollmentsQuery = useMemoFirebase(
        () => (firestore && user ? collection(firestore, `users/${user.uid}/enrollments`) : null),
        [firestore, user]
    );
    const { data: enrollments, isLoading: enrollmentsLoading } = useCollection(enrollmentsQuery);

    const activeEnrollments = useMemo(() => {
        return enrollments?.filter(e => e.enrollmentStatus === 'active') || [];
    }, [enrollments]);

    const pendingEnrollments = useMemo(() => {
        return enrollments?.filter(e => e.enrollmentStatus === 'pending') || [];
    }, [enrollments]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/login');
        } else if (user && firestore) {
            const userRef = doc(firestore, 'users', user.uid);
            getDoc(userRef).then(userDoc => {
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setUserRole(userData.role);
                    if (userData.role === 'user' && !userData.hasCompletedOnboarding) {
                        router.push('/welcome');
                    }
                } else {
                    router.push('/login');
                }
            });
        }
    }, [user, isUserLoading, router, firestore]);

    const isLoading = isUserLoading || enrollmentsLoading || !userRole;

    if (isLoading) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-12 w-1/3" />
                <Skeleton className="h-40 w-full" />
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }

    const isAdminOrDev = userRole === 'admin' || userRole === 'developer' || userRole === 'teacher';

    return (
        <>
            {/* Colorful Header */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 p-8 sm:p-12 mb-12 shadow-2xl animate-fade-in">
                <div className="relative z-10 text-white">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 font-display">Welcome back, {user?.displayName?.split(' ')[0]}!</h1>
                    <p className="text-blue-100 text-lg max-w-2xl">Ready to continue your journey to English mastery? Pick a module below to get started.</p>
                </div>
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/10 blur-2xl"></div>
            </div>

            {isAdminOrDev && (
                <Card className="mb-8 border-amber-500 bg-amber-500/10">
                    <CardHeader className="flex-row items-center justify-between">
                        <div>
                            <CardTitle>Admin Access</CardTitle>
                            <CardDescription>Manage users and content from the admin panel.</CardDescription>
                        </div>
                        <Button asChild>
                            <Link href="/admin/dashboard" className="flex items-center gap-2">
                                <Briefcase /> Go to Admin
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>
            )}

            {/* Enrollment Status - Compact */}
            <div className="mb-12">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-primary" /> Current Status
                </h2>
                <Card className="overflow-hidden border-none shadow-md bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                        {enrollments && enrollments.length > 0 ? (
                            <div className="space-y-4">
                                {enrollments.map(e => (
                                    <div key={e.id}>
                                        {e.enrollmentStatus === 'pending' ? (
                                            <Alert variant="default" className="border-amber-500 bg-amber-500/10">
                                                <Clock className="h-4 w-4" />
                                                <AlertTitle>{e.courseId} ({e.batchName}) - Pending Verification</AlertTitle>
                                                <AlertDescription>We're confirming your payment. Access will be granted shortly.</AlertDescription>
                                            </Alert>
                                        ) : (
                                            <Alert variant="default" className="border-green-500 bg-green-500/10 text-green-900 dark:text-green-100">
                                                <Check className="h-4 w-4 text-green-600" />
                                                <AlertTitle>{e.courseId} ({e.batchName}) - Active</AlertTitle>
                                                <AlertDescription>You have full access to this course.</AlertDescription>
                                            </Alert>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-muted-foreground mb-4">You are not enrolled in any courses yet.</p>
                                <Button asChild variant="outline"><Link href="/courses">Explore Courses</Link></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main Menu Grid with Spotlight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {lmsFeatures.map((feature, idx) => {
                    const Icon = feature.icon;
                    return (
                        <Link href={feature.href} key={idx} className="block h-full cursor-pointer group">
                            <SpotlightCard className={`h-full rounded-2xl border bg-card/50 backdrop-blur-sm p-6 flex flex-col transition-all duration-300 ${feature.border} group-hover:-translate-y-1 group-hover:shadow-lg`}>
                                {/* Gradient Background Effect */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                <div className={`relative z-10 w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110 duration-300`}>
                                    <Icon className={`h-6 w-6 ${feature.color}`} />
                                </div>

                                <div className="relative z-10 flex-grow">
                                    <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </div>

                                <div className="relative z-10 mt-4 flex items-center text-sm font-medium text-muted-foreground group-hover:text-primary transition-colors">
                                    Open <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                                </div>
                            </SpotlightCard>
                        </Link>
                    );
                })}
            </div>

            {/* Empty State Fallback Logic */}
            {activeEnrollments.length === 0 && pendingEnrollments.length === 0 && (
                <div className="mt-12 p-8 text-center bg-muted/30 rounded-2xl border border-dashed">
                    <BookCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Start Your Learning Journey</h3>
                    <p className="text-muted-foreground mb-6">Enroll in a course to unlock full access to lectures and exams.</p>
                    <Button asChild><Link href="/courses">View Courses</Link></Button>
                </div>
            )}
        </>
    );
}
