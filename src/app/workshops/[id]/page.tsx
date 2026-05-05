'use client';

import React, { useEffect, useState, use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Calendar, Clock, User, CheckCircle2, Play, FileText, 
    Lock, Star, ExternalLink, Download, AlertCircle, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { 
    getWorkshopById, 
    registerForWorkshop, 
    Workshop, 
    WorkshopRegistration,
    getUserWorkshops,
    completeWorkshopReview
} from '@/lib/services/workshop.service';
import { useRouter } from 'next/navigation';

import Link from 'next/link';

export default function WorkshopDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params); router = useRouter();
    const { firestore, user, isUserLoading } = useFirebase();
    
    const [workshop, setWorkshop] = useState<Workshop | null>(null);
    const [registration, setRegistration] = useState<WorkshopRegistration | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showReviewPrompt, setShowReviewPrompt] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            if (!id || !firestore) return;
            
            const ws = await getWorkshopById(firestore, id);
            setWorkshop(ws);

            if (user) {
                const userWs = await getUserWorkshops(firestore, user.uid);
                const reg = userWs.find(r => r.workshopId === id);
                setRegistration(reg || null);
            }
            setLoading(false);
        };
        loadData();
    }, [id, firestore, user]);

    const handleRegister = async () => {
        if (!user) {
            router.push(`/login?redirect=/workshops/${id}`);
            return;
        }

        setActionLoading(true);
        const result = await registerForWorkshop(firestore, {
            workshopId: id,
            userId: user.uid,
            fullName: user.displayName || 'Student',
            email: user.email || '',
            phone: '', // Would normally come from a profile or form
        });

        if (result.success) {
            // Refresh registrations
            const userWs = await getUserWorkshops(firestore, user.uid);
            const reg = userWs.find(r => r.workshopId === id);
            setRegistration(reg || null);
        }
        setActionLoading(false);
    };

    const handleVerifyReview = async () => {
        if (!registration?.id) return;
        setActionLoading(true);
        // In a real app, you might verify this via API or just trust the user click
        const success = await completeWorkshopReview(firestore, registration.id);
        if (success) {
            setRegistration({ ...registration, hasReviewed: true });
        }
        setActionLoading(false);
    };

    if (loading || isUserLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-12 w-12 text-primary animate-spin" />
            </div>
        );
    }

    if (!workshop) {
        return (
            <div className="min-h-screen flex items-center justify-center flex-col gap-4">
                <AlertCircle className="h-16 w-16 text-red-500" />
                <h2 className="text-2xl font-black">Workshop Not Found</h2>
                <Button asChild><Link href="/workshops">Back to Workshops</Link></Button>
            </div>
        );
    }

    const isLive = true; // Placeholder for real-time check

    return (
        <div className="w-full bg-slate-50 dark:bg-[#020617] min-h-screen pb-24 pt-32">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto space-y-12">
                    
                    {/* Header Section */}
                    <div className="grid lg:grid-cols-3 gap-12 items-start">
                        <div className="lg:col-span-2 space-y-8">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <div className="flex flex-wrap gap-3">
                                    <span className="px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-widest border border-primary/20">
                                        Free Monthly Workshop
                                    </span>
                                    {isLive && (
                                        <span className="px-4 py-1.5 rounded-full bg-red-500 text-white text-xs font-black uppercase tracking-widest animate-pulse">
                                            Live Now
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black font-headline tracking-tighter leading-[0.9]">
                                    {workshop.title}
                                </h1>
                                <p className="text-xl text-muted-foreground font-medium leading-relaxed">
                                    {workshop.description}
                                </p>
                                
                                <div className="grid sm:grid-cols-3 gap-6 pt-6">
                                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                                        <Calendar className="h-6 w-6 text-primary mb-3" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Date</p>
                                        <p className="text-lg font-black mt-1">
                                            {new Date(workshop.date instanceof Date ? workshop.date : (workshop.date as any).toDate()).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                                        <Clock className="h-6 w-6 text-primary mb-3" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Time</p>
                                        <p className="text-lg font-black mt-1">{workshop.time}</p>
                                    </div>
                                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800">
                                        <User className="h-6 w-6 text-primary mb-3" />
                                        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Instructor</p>
                                        <p className="text-lg font-black mt-1">{workshop.instructor}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Registration Sidebar */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="lg:col-span-1"
                        >
                            <Card className="p-8 rounded-[40px] border-none bg-white dark:bg-slate-900 shadow-2xl space-y-8 sticky top-32">
                                <div className="space-y-4">
                                    <h3 className="text-2xl font-black">Registration</h3>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span className="text-muted-foreground">Status</span>
                                        <span className={registration ? "text-green-500" : "text-amber-500"}>
                                            {registration ? "Registered" : "Not Registered"}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm font-bold">
                                        <span className="text-muted-foreground">Seats</span>
                                        <span>{workshop.seatsAvailable} Left</span>
                                    </div>
                                </div>

                                {!registration ? (
                                    <Button 
                                        className="w-full h-16 rounded-2xl text-lg font-black"
                                        disabled={actionLoading}
                                        onClick={handleRegister}
                                    >
                                        {actionLoading ? <Loader2 className="animate-spin" /> : "Register for Free"}
                                    </Button>
                                ) : (
                                    <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 flex items-center gap-3 text-green-600 dark:text-green-400 font-bold">
                                        <CheckCircle2 className="h-5 w-5" />
                                        Spot Secured!
                                    </div>
                                )}

                                <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                    <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Workshop Benefits</p>
                                    <ul className="space-y-3">
                                        {workshop.benefits.map((benefit, i) => (
                                            <li key={i} className="flex items-start gap-2 text-sm font-medium">
                                                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                                                {benefit}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </Card>
                        </motion.div>
                    </div>

                    {/* Live Stream Section */}
                    <AnimatePresence>
                        {registration && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8 pt-12 border-t border-slate-200 dark:border-slate-800"
                            >
                                <div className="flex items-center justify-between">
                                    <h2 className="text-3xl font-black">Workshop Live Stream</h2>
                                    <div className="flex items-center gap-2 text-red-500 font-black text-sm uppercase tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                        Streaming Now
                                    </div>
                                </div>
                                
                                <div className="aspect-video w-full rounded-[48px] overflow-hidden bg-black shadow-2xl border border-white/10">
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${workshop.youtubeLink.split('v=')[1] || workshop.youtubeLink.split('/').pop()}`}
                                        title="Workshop Live Stream"
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                        allowFullScreen
                                    ></iframe>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Notes Download Section */}
                    <AnimatePresence>
                        {registration && (
                            <motion.div
                                initial={{ opacity: 0, y: 40 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-8 pt-24"
                            >
                                <div className="max-w-4xl mx-auto p-12 rounded-[48px] bg-slate-900 text-white shadow-2xl relative overflow-hidden">
                                    <div className="relative z-10 grid md:grid-cols-2 gap-12 items-center">
                                        <div className="space-y-6">
                                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center">
                                                <FileText className="h-8 w-8 text-primary" />
                                            </div>
                                            <h3 className="text-3xl font-black">Workshop Study Notes</h3>
                                            <p className="text-white/60 leading-relaxed font-medium">
                                                Unlock the full set of PDF study notes and exam strategy slides used in this workshop.
                                            </p>
                                        </div>

                                        <div className="space-y-6">
                                            {!registration.hasReviewed ? (
                                                <div className="space-y-4">
                                                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                                                        <Lock className="h-4 w-4" />
                                                        Requires Google Review to Unlock
                                                    </p>
                                                    <Button 
                                                        className="w-full h-16 rounded-2xl bg-white text-slate-900 hover:bg-slate-100 font-black text-lg"
                                                        onClick={() => {
                                                            window.open('https://search.google.com/local/writereview?placeid=ChIJR_7X-89Z4joR_7X-89Z4joR', '_blank');
                                                            setShowReviewPrompt(true);
                                                        }}
                                                    >
                                                        Leave a Google Review <ExternalLink className="ml-2 h-5 w-5" />
                                                    </Button>
                                                    
                                                    {showReviewPrompt && (
                                                        <Button 
                                                            variant="ghost" 
                                                            className="w-full text-white/60 hover:text-white"
                                                            onClick={handleVerifyReview}
                                                            disabled={actionLoading}
                                                        >
                                                            {actionLoading ? <Loader2 className="animate-spin" /> : "I have submitted my review"}
                                                        </Button>
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center gap-3 text-primary font-bold">
                                                        <CheckCircle2 className="h-5 w-5" />
                                                        Downloads Unlocked!
                                                    </div>
                                                    <Button 
                                                        className="w-full h-16 rounded-2xl bg-primary text-white hover:bg-primary/90 font-black text-lg shadow-[0_0_30px_rgba(79,70,229,0.3)]"
                                                        asChild
                                                    >
                                                        <a href={workshop.notesFileUrl} download target="_blank">
                                                            Download Notes <Download className="ml-2 h-5 w-5" />
                                                        </a>
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Decorative Icon */}
                                    <Star className="absolute -bottom-12 -right-12 h-64 w-64 text-white/5 rotate-12" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                </div>
            </div>
        </div>
    );
}

import Link from 'next/link';
