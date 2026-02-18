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
import { ChevronRight, ListVideo, FileText, BookOpen, BarChart3, Calendar, MessageSquare, Briefcase, GraduationCap, Clock, Home, BookCheck, Check, Globe, Zap, Target, Bot, Sparkles, Play, Columns } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { PerformanceOverview } from '@/components/dashboard/PerformanceOverview';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { QuickActions } from '@/components/dashboard/QuickActions';

const lmsFeatures = [
    { title: 'Learn with AI Tutor', description: 'Personalized neural faculty for PTE, IELTS, and CELPIP.', href: '/dashboard/ai-tutor', icon: Bot, color: "text-accent-1", bg: "bg-accent-1/10", border: "hover:border-accent-1/50", gradient: "from-accent-1/20 to-transparent" },
    { title: 'AI Score Master', description: 'Precision PTE practice with the neural scoring matrix.', href: '/dashboard/ai-score-test', icon: Target, color: "text-indigo-500", bg: "bg-indigo-500/10", border: "hover:border-indigo-500/50", gradient: "from-indigo-500/20 to-transparent" },
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
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-blue-600 to-cyan-500 p-8 sm:p-12 mb-12 shadow-2xl border border-white/10 group">
                {/* Animated Background Elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 h-64 w-64 rounded-full bg-white/10 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-40 w-40 rounded-full bg-black/20 blur-2xl group-hover:scale-125 transition-transform duration-700"></div>
                <div className="absolute inset-0 bg-grid-white/[0.1] -z-0"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8 text-white">
                    <div className="max-w-2xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/20 text-[10px] font-black uppercase tracking-widest mb-6"
                        >
                            <Zap className="h-3 w-3 fill-white" /> AI Enhanced Platform
                        </motion.div>
                        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 font-display tracking-tight leading-tight">
                            Welcome back, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">
                                {user?.displayName?.split(' ')[0]}!
                            </span>
                        </h1>
                        <p className="text-blue-50 text-base sm:text-lg max-w-xl font-medium opacity-90 leading-relaxed">
                            Your linguistic intelligence has increased by <span className="font-bold underline decoration-accent-2 underline-offset-4">12%</span> this week. Keep up the momentum!
                        </p>
                    </div>

                    <div className="hidden lg:flex flex-col items-end gap-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card bg-white/10 border-white/20 p-4 rounded-3xl min-w-[140px] text-center">
                                <div className="text-2xl font-black">740</div>
                                <div className="text-[10px] font-bold uppercase opacity-60">Mock Credits</div>
                            </div>
                            <div className="glass-card bg-white/10 border-white/20 p-4 rounded-3xl min-w-[140px] text-center">
                                <div className="text-2xl font-black">Day 12</div>
                                <div className="text-[10px] font-bold uppercase opacity-60">Study Streak</div>
                            </div>
                        </div>
                        <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl h-12 px-6 font-bold shadow-xl">
                            Resume Last Lesson
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
                {/* Advanced Analytics */}
                <PerformanceOverview />

                {/* Recent Activity */}
                <RecentActivity />

                {/* Quick Actions */}
                <QuickActions />
            </div>

            {isAdminOrDev && (
                <Card className="mb-12 overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent relative group">
                    <div className="absolute inset-y-0 right-0 w-64 bg-gradient-to-l from-primary/10 to-transparent -z-10 group-hover:w-96 transition-all" />
                    <CardHeader className="flex-row items-center justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Briefcase className="h-5 w-5 text-primary" /> Multi-Role Terminal
                            </CardTitle>
                            <CardDescription>Administrative functions are unlocked for your account.</CardDescription>
                        </div>
                        <Button asChild className="rounded-xl px-8 h-12 bg-primary group-hover:scale-105 transition-transform">
                            <Link href="/admin/dashboard" className="flex items-center gap-2">
                                Launch Admin Panel <ChevronRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                </Card>
            )}

            {/* Main Menu Grid with Premium Styling */}
            <div className="mb-12">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h2 className="text-2xl font-black font-display tracking-tight flex items-center gap-2">
                            <Zap className="h-6 w-6 text-primary" /> Command Center
                        </h2>
                        <p className="text-sm text-muted-foreground mt-1 font-medium">Access your learning modules and portals</p>
                    </div>
                    <Button variant="ghost" className="text-xs font-bold uppercase tracking-widest hover:bg-primary/5">View All Modules</Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {lmsFeatures.map((feature, idx) => {
                        const Icon = feature.icon;
                        return (
                            <Link href={feature.href} key={idx} className="block cursor-pointer group">
                                <SpotlightCard className={`h-full rounded-[2rem] border-2 bg-card/40 backdrop-blur-md p-8 flex flex-col transition-all duration-500 ${feature.border} group-hover:-translate-y-2 group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.1)]`}>
                                    <div className={`relative z-10 w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-all group-hover:rotate-12 group-hover:scale-110 shadow-lg`}>
                                        <Icon className={`h-7 w-7 ${feature.color}`} />
                                    </div>

                                    <div className="relative z-10 flex-grow">
                                        <h3 className="text-lg font-black mb-2 group-hover:text-primary transition-colors leading-tight">{feature.title}</h3>
                                        <p className="text-xs text-muted-foreground font-medium leading-relaxed opacity-80">{feature.description}</p>
                                    </div>

                                    <div className="relative z-10 mt-6 flex items-center text-[10px] font-black uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">
                                        Initialize <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-2" />
                                    </div>
                                </SpotlightCard>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* Enrollment Status - Modern Section */}
            <div className="mb-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <h2 className="text-2xl font-black font-display tracking-tight flex items-center gap-2">
                        <GraduationCap className="h-6 w-6 text-primary" /> Academic Enrollment
                    </h2>
                </div>

                <Card className="overflow-hidden border-2 border-dashed bg-muted/20 backdrop-blur-sm rounded-[2.5rem]">
                    <CardContent className="p-10">
                        {enrollments && enrollments.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {enrollments.map(e => (
                                    <motion.div
                                        key={e.id}
                                        whileHover={{ scale: 1.02 }}
                                        className={`p-6 rounded-3xl border ${e.enrollmentStatus === 'pending' ? 'bg-amber-500/5 border-amber-500/20' : 'bg-green-500/5 border-green-500/20'}`}
                                    >
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <Badge variant={e.enrollmentStatus === 'pending' ? 'outline' : 'default'} className={e.enrollmentStatus === 'pending' ? 'text-amber-600 border-amber-500' : 'bg-green-500 hover:bg-green-600'}>
                                                    {e.enrollmentStatus.toUpperCase()}
                                                </Badge>
                                                <h4 className="text-xl font-black mt-2">{e.courseId}</h4>
                                                <p className="text-sm font-bold opacity-60">{e.batchName}</p>
                                            </div>
                                            <div className={`p-3 rounded-2xl ${e.enrollmentStatus === 'pending' ? 'bg-amber-100' : 'bg-green-100'}`}>
                                                {e.enrollmentStatus === 'pending' ? <Clock className="h-6 w-6 text-amber-600" /> : <Check className="h-6 w-6 text-green-600" />}
                                            </div>
                                        </div>
                                        <p className="text-sm text-muted-foreground font-medium mb-6">
                                            {e.enrollmentStatus === 'pending' ? "Security verification in progress. Access will be granted shortly." : "Full academic access granted. All modules are unlocked."}
                                        </p>
                                        <Button className="w-full rounded-2xl font-bold h-12" variant={e.enrollmentStatus === 'pending' ? 'outline' : 'default'}>
                                            {e.enrollmentStatus === 'pending' ? "Check Status" : "Enter Classroom"}
                                        </Button>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <BookCheck className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-black mb-2">Initialize Your Journey</h3>
                                <p className="text-muted-foreground font-medium mb-8 max-w-sm mx-auto">You haven't enrolled in any courses yet. Unlock your potential today.</p>
                                <Button asChild size="lg" className="rounded-2xl px-10 h-14 font-black tracking-widest shadow-xl shadow-primary/20"><Link href="/courses">BROWSE ACADEMIC COURSES</Link></Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
