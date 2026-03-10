'use client';

import { useEffect, useState } from 'react';
import { useFirebase, useUser } from '@/firebase';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GraduationCap, AlertCircle, LayoutDashboard, Calendar, Globe, Zap, ArrowRight, Loader2, BookOpen } from 'lucide-react';
import Link from 'next/link';

interface CoursePurchase {
    id: string;
    courseId: string;
    activatedAt: any;
    accessStatus: string;
}

export default function MyPurchasesPage() {
    const { user } = useUser();
    const [purchases, setPurchases] = useState<CoursePurchase[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchPurchases = async () => {
            try {
                const q = query(
                    collection(db, 'user_course_access'),
                    where('userId', '==', user.uid),
                    orderBy('activatedAt', 'desc')
                );
                const snapshot = await getDocs(q);
                const list = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as CoursePurchase));
                setPurchases(list);
            } catch (error) {
                console.error('Error fetching purchases:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPurchases();
    }, [user]);

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-20 text-center">
                <p>Please login to view your purchases.</p>
                <Button asChild className="mt-4">
                    <Link href="/login">Login</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/20 pb-20">
            <div className="container mx-auto px-4 py-16 space-y-10">
                <div className="text-center space-y-4 max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest mb-2">
                        My Learning Journey
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tight text-foreground">
                        Your <span className="gradient-text italic">Active Courses</span>
                    </h1>
                </div>

                {/* Important Notice Card */}
                <Card className="rounded-[40px] border-none bg-primary/5 shadow-2xl overflow-hidden border border-primary/10">
                    <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
                        <div className="bg-primary/10 p-6 rounded-[30px] shrink-0">
                            <AlertCircle className="h-12 w-12 text-primary" />
                        </div>
                        <div className="space-y-4 text-center md:text-left">
                            <h3 className="text-2xl font-black font-headline">LMS Enrollment Instructions</h3>
                            <p className="text-lg text-muted-foreground font-medium leading-relaxed">
                                To access your course materials and practice platform:
                            </p>
                            <div className="flex flex-col gap-3 font-bold text-foreground/80">
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                    <span>Log into the LMS using the SAME EMAIL address.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                    <span>If you don't have an account, create one on the LMS portal.</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-2 w-2 rounded-full bg-primary shrink-0" />
                                    <span>Send a "Request Access" message to support once logged in.</span>
                                </div>
                            </div>
                            <p className="bg-orange-500/10 text-orange-600 px-4 py-2 rounded-xl text-sm font-black border border-orange-500/20 inline-block mt-4">
                                NOTE: Admins will grant access manually within 24 hours.
                            </p>
                        </div>
                        <div className="shrink-0 flex items-center justify-center md:ml-auto">
                            <Button asChild size="lg" className="h-16 px-10 rounded-[25px] text-lg font-black bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 group">
                                <Link href="https://lms.smartlabs.lk" target="_blank">
                                    Open LMS Portal
                                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-64 rounded-3xl bg-muted animate-pulse" />
                        ))
                    ) : purchases.length === 0 ? (
                        <div className="col-span-full py-20 text-center space-y-6">
                            <div className="bg-muted/50 p-6 rounded-full inline-block">
                                <BookOpen className="h-12 w-12 text-muted-foreground" />
                            </div>
                            <p className="text-2xl font-black font-headline text-muted-foreground">You haven't purchased any courses yet.</p>
                            <Button asChild variant="outline" className="h-12 rounded-2xl">
                                <Link href="/courses">Browse Courses</Link>
                            </Button>
                        </div>
                    ) : (
                        purchases.map((purchase) => (
                            <Card key={purchase.id} className="rounded-3xl border-border/40 shadow-xl overflow-hidden hover:-translate-y-2 transition-all duration-300 group">
                                <div className="h-32 bg-gradient-to-br from-primary to-indigo-900 p-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <GraduationCap className="h-24 w-24 -rotate-12" />
                                    </div>
                                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-2 uppercase font-black tracking-widest text-[10px]">Purchased</Badge>
                                    <CardTitle className="text-2xl font-black text-white font-headline leading-tight truncate">{purchase.courseId}</CardTitle>
                                </div>
                                <CardContent className="p-8 space-y-6">
                                    <div className="flex items-center justify-between text-sm py-2 border-b">
                                        <span className="font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" /> Purchase Date
                                        </span>
                                        <span className="font-black">
                                            {purchase.activatedAt?.toDate().toLocaleDateString('en-GB', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm py-2">
                                        <span className="font-black text-muted-foreground uppercase flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-primary" /> Status
                                        </span>
                                        <Badge className="bg-green-500/10 text-green-600 border-green-500/20 uppercase font-black tracking-widest text-[10px] capitalize">
                                            {purchase.accessStatus}
                                        </Badge>
                                    </div>
                                    <Button asChild className="w-full h-12 rounded-2xl bg-muted/50 hover:bg-primary hover:text-white text-foreground font-black group-hover:shadow-lg transition-all">
                                        <Link href="https://lms.smartlabs.lk" target="_blank">Access Content</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
