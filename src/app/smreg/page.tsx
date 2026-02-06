'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Video,
    Users,
    Calendar,
    Clock,
    CheckCircle2,
    ArrowRight,
    Sparkles,
    Loader2,
    AlertCircle,
    Link as LinkIcon
} from 'lucide-react';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';
import { motion } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import Link from 'next/link';

function RegistrationContent() {
    const searchParams = useSearchParams();
    const eventId = searchParams.get('id');
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const { toast } = useToast();

    const eventDocPath = eventId ? `events/${eventId}` : null;
    const eventDocRef = useMemoFirebase(() =>
        firestore && eventDocPath ? doc(firestore, eventDocPath) : null,
        [firestore, eventDocPath]
    );

    const { data: event, isLoading: eventLoading } = useDoc(eventDocRef);

    const isRegistered = event?.registrations?.some((reg: any) => reg.uid === user?.uid);

    const handleRegister = async () => {
        if (!user || !eventDocRef) return;

        try {
            await updateDoc(eventDocRef, {
                registrations: arrayUnion({
                    uid: user.uid,
                    name: user.displayName || user.email,
                    email: user.email,
                    timestamp: new Date().toISOString()
                })
            });
            toast({
                title: "Registration Successful!",
                description: "You have been added to the event list.",
            });
        } catch (error) {
            console.error("Registration error:", error);
            toast({
                title: "Error",
                description: "Failed to register. Please try again.",
                variant: "destructive"
            });
        }
    };

    if (isUserLoading || eventLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="font-bold text-muted-foreground">Syncing Matrix...</p>
            </div>
        );
    }

    if (!eventId || !event) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center">
                    <AlertCircle className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black">Event Not Found</h2>
                    <p className="text-muted-foreground max-w-md">The event link might be expired or the session is inactive.</p>
                </div>
                <Button asChild className="rounded-2xl px-8">
                    <Link href="/">Back to Home</Link>
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            {/* Event Hero */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative aspect-[16/9] md:aspect-[21/9] rounded-[48px] overflow-hidden shadow-2xl border border-border/50"
            >
                <Image
                    src={event.image}
                    alt={event.title}
                    fill
                    className="object-cover"
                    unoptimized={event.image?.startsWith('/')}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div className="space-y-3">
                        <Badge className="bg-primary/20 backdrop-blur-md border border-primary/30 text-white font-black uppercase tracking-widest px-4 py-1.5">
                            {event.category}
                        </Badge>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-none">
                            {event.title}
                        </h1>
                    </div>
                    {isRegistered ? (
                        <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-2xl backdrop-blur-md">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <span className="font-black text-green-500 uppercase tracking-widest text-sm">Registered</span>
                        </div>
                    ) : (
                        <Button
                            size="xl"
                            onClick={handleRegister}
                            className="h-16 px-10 rounded-2xl bg-primary text-white font-black text-lg transition-all hover:scale-105 active:scale-95 shadow-xl shadow-primary/20"
                        >
                            Confirm Attendance
                            <ArrowRight className="ml-2 h-6 w-6" />
                        </Button>
                    )}
                </div>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
                {/* Main Info */}
                <div className="md:col-span-2 space-y-8">
                    <div className="space-y-4">
                        <h2 className="text-3xl font-black">About Session</h2>
                        <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                            {event.description}
                        </p>
                    </div>

                    {/* Features/Details */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-card border border-border/50 rounded-3xl space-y-2">
                            <Calendar className="h-6 w-6 text-primary" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Date</p>
                            <p className="font-black text-xl">{event.date}</p>
                        </div>
                        <div className="p-6 bg-card border border-border/50 rounded-3xl space-y-2">
                            <Users className="h-6 w-6 text-accent-3" />
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Registered</p>
                            <p className="font-black text-xl">{event.registrations?.length || 0} Learners</p>
                        </div>
                    </div>

                    {/* Access Section (Only if registered) */}
                    {isRegistered && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-10 bg-gradient-to-br from-primary via-primary/80 to-accent-3 rounded-[40px] text-white shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Video className="h-40 w-40" />
                            </div>
                            <div className="relative z-10 space-y-6">
                                <div className="space-y-1">
                                    <h3 className="text-4xl font-black tracking-tight">Access Link</h3>
                                    <p className="text-white/70 font-bold uppercase tracking-widest text-xs">Confidential Session Access</p>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <Button
                                        size="xl"
                                        asChild
                                        className="bg-white text-primary hover:bg-white/90 font-black rounded-2xl h-16 px-8"
                                    >
                                        <a href={event.link} target="_blank" rel="noopener noreferrer">
                                            <Video className="mr-2 h-6 w-6" />
                                            Launch Session
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="xl"
                                        className="border-white/30 bg-white/10 text-white hover:bg-white/20 font-black rounded-2xl h-16 px-8 backdrop-blur-sm"
                                        onClick={() => {
                                            navigator.clipboard.writeText(event.link);
                                            toast({ title: "Copied!", description: "Link copied to clipboard." });
                                        }}
                                    >
                                        <LinkIcon className="mr-2 h-5 w-5" />
                                        Copy Link
                                    </Button>
                                </div>
                                <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.2em]">
                                    Please do not share this link with unregistered users.
                                </p>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    <Card className="rounded-[32px] border-border/50 overflow-hidden">
                        <CardHeader className="bg-muted/30">
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Attendees</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar">
                                {event.registrations?.map((reg: any, i: number) => (
                                    <div key={i} className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                            {reg.name.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black truncate max-w-[150px]">{reg.name}</span>
                                            <span className="text-[10px] text-muted-foreground font-bold">{new Date(reg.timestamp).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                                {(!event.registrations || event.registrations.length === 0) && (
                                    <p className="text-xs text-muted-foreground text-center py-4 font-bold">Be the first to register!</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-accent-1/10 rounded-[32px] border border-accent-1/20 space-y-4">
                        <Sparkles className="h-8 w-8 text-accent-1" />
                        <h4 className="text-lg font-black tracking-tight leading-tight">Smart Labs Exclusive</h4>
                        <p className="text-xs text-muted-foreground font-bold leading-relaxed uppercase tracking-wider">
                            This is an authorized session. All attendees are logged for certification and attendance tracking.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function RegistrationPage() {
    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-[#020617]">
            <Header />
            <main className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <Suspense fallback={
                    <div className="flex items-center justify-center min-h-[60vh]">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    </div>
                }>
                    <RegistrationContent />
                </Suspense>
            </main>
            <Footer />
        </div>
    );
}
