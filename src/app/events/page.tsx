'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, Sparkles, Target, Globe, Zap, Award, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import Header from '@/components/layout/header';
import Footer from '@/components/layout/footer';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

const categoryColors: Record<string, string> = {
    Workshop: "bg-accent-1/10 text-accent-1 border-accent-1/20",
    Seminar: "bg-accent-2/10 text-accent-2 border-accent-2/20",
    "Live Class": "bg-accent-3/10 text-accent-3 border-accent-3/20",
    "Special Offer": "bg-accent-4/10 text-accent-4 border-accent-4/20",
};

export default function EventsPage() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const router = useRouter();

    const eventsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'events'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: events, isLoading } = useCollection(eventsQuery);

    return (
        <div className="min-h-screen bg-background">
            <Header />

            <main className="pt-24 pb-20">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden">
                    <div className="absolute inset-0 -z-10">
                        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 blur-[100px] rounded-full" />
                        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-3/10 blur-[100px] rounded-full" />
                    </div>

                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center space-y-6"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-bold">
                                <Sparkles className="h-4 w-4" />
                                UPCOMING EVENTS & OFFERS
                            </div>
                            <h1 className="text-5xl sm:text-7xl font-black tracking-tighter text-foreground">
                                ELEVATE YOUR <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent-3">EXPERIENCE</span>
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto font-medium">
                                Stay updated with our latest workshops, webinars, and exclusive promotions designed to accelerate your success.
                            </p>
                        </motion.div>
                    </div>
                </section>

                {/* Events Grid */}
                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        </div>
                    ) : (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                        >
                            {events?.map((event: any) => (
                                <motion.div
                                    key={event.id}
                                    variants={itemVariants}
                                    className="group relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-[32px] overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-xl"
                                >
                                    {/* Image Wrap - Forced to show well but the user wants 9:16 aspect in admin, so we'll accommodate that layout here too */}
                                    <div className="relative aspect-[9/16] overflow-hidden">
                                        <Image
                                            src={event.image}
                                            alt={event.title}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                            unoptimized={event.image?.startsWith('/')}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                        <div className="absolute top-4 left-4">
                                            <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryColors[event.category] || categoryColors['Workshop']}`}>
                                                {event.category}
                                            </span>
                                        </div>

                                        {/* Content Over Image for 9:16 style */}
                                        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-4">
                                            <div className="flex items-center gap-3 text-xs font-bold text-primary">
                                                <Calendar className="h-4 w-4" />
                                                {event.date}
                                            </div>
                                            <h3 className="text-2xl font-black tracking-tight text-white group-hover:text-primary transition-colors line-clamp-2">
                                                {event.title}
                                            </h3>
                                            <p className="text-sm text-white/70 font-medium leading-relaxed line-clamp-3">
                                                {event.description}
                                            </p>

                                            <div className="pt-4 flex items-center justify-between">
                                                <Button
                                                    onClick={() => {
                                                        if (!user) {
                                                            const currentPath = window.location.pathname;
                                                            router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
                                                            return;
                                                        }
                                                        if (event.bindRegistration) {
                                                            router.push(`/smreg?id=${event.id}`);
                                                        } else {
                                                            window.open(event.link, '_blank');
                                                        }
                                                    }}
                                                    className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold group/btn cursor-pointer"
                                                >
                                                    {event.buttonText}
                                                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                                <div className="h-10 w-10 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors cursor-pointer">
                                                    <Zap className="h-4 w-4" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}

                    {!isLoading && (!events || events.length === 0) && (
                        <div className="text-center py-20 space-y-4">
                            <Sparkles className="h-12 w-12 text-muted-foreground mx-auto" />
                            <h3 className="text-xl font-bold">No events scheduled yet</h3>
                            <p className="text-muted-foreground">Check back soon for exciting updates!</p>
                        </div>
                    )}
                </section>
            </main>

            <Footer />
        </div>
    );
}
