'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X as XIcon, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon, Calendar as CalendarIcon, ArrowRight as ArrowRightIcon, Sparkles as SparklesIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useFirebase, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';

export function EventPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { firestore } = useFirebase();
    const { user } = useUser();
    const router = useRouter();

    const eventsQuery = useMemoFirebase(() =>
        firestore ? query(collection(firestore, 'events'), orderBy('createdAt', 'desc')) : null,
        [firestore]
    );
    const { data: events, isLoading } = useCollection(eventsQuery);

    // Filter out expired events
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const activeEvents = events?.filter((event: any) => {
        if (!event.expiryDate) return true; // Show if no expiry set (fallback)
        return event.expiryDate >= today;
    }) || [];

    useEffect(() => {
        if (activeEvents.length > 0) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [activeEvents.length]);

    const handleClose = () => {
        setIsOpen(false);
    };

    const nextEvent = () => {
        if (activeEvents.length === 0) return;
        setCurrentIndex((prev) => (prev + 1) % activeEvents.length);
    };

    const prevEvent = () => {
        if (activeEvents.length === 0) return;
        setCurrentIndex((prev) => (prev - 1 + activeEvents.length) % activeEvents.length);
    };

    if (isLoading || activeEvents.length === 0) return null;

    const currentEvent = activeEvents[currentIndex % activeEvents.length];

    return (
        <AnimatePresence>
            {isOpen && currentEvent && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 pointer-events-none">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={handleClose}
                        className="absolute inset-0 bg-background/60 backdrop-blur-sm pointer-events-auto"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[32px] md:rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto max-h-[90vh] overflow-y-auto no-scrollbar"
                    >
                        <div className="flex flex-col md:flex-row min-h-full">
                            {/* Image Side */}
                            <div className="relative w-full md:w-1/2 aspect-[870/1080] md:h-auto overflow-hidden shrink-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentEvent.id}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.4 }}
                                        className="absolute inset-0"
                                    >
                                        <Image
                                            src={currentEvent.image}
                                            alt={currentEvent.title}
                                            fill
                                            className="object-cover"
                                            unoptimized={currentEvent.image?.startsWith('/')}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    </motion.div>
                                </AnimatePresence>

                                <div className="absolute top-6 left-6">
                                    <span className="px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-white text-[10px] font-black uppercase tracking-widest">
                                        {currentEvent.category}
                                    </span>
                                </div>
                            </div>

                            {/* Content Side */}
                            <div className="relative w-full md:w-1/2 p-8 md:p-10 flex flex-col justify-center">
                                <button
                                    onClick={handleClose}
                                    className="absolute top-6 right-6 p-2 rounded-full hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                                >
                                    <XIcon className="h-5 w-5" />
                                </button>

                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={currentEvent.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.3 }}
                                        className="space-y-4"
                                    >
                                        <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                            <CalendarIcon className="h-4 w-4" />
                                            {currentEvent.date}
                                        </div>

                                        <h2 className="text-3xl font-black tracking-tight leading-tight">
                                            {currentEvent.title.replace(/IELTS\s*&\s*/gi, '').replace(/&\s*IELTS/gi, '').replace(/IELTS/gi, 'PTE')}
                                        </h2>

                                        <p className="text-muted-foreground text-sm font-medium leading-relaxed line-clamp-4">
                                            {currentEvent.description.replace(/IELTS\s*&\s*/gi, '').replace(/&\s*IELTS/gi, '').replace(/IELTS/gi, 'PTE')}
                                        </p>

                                        <div className="pt-4 flex flex-col gap-3">
                                            <Button
                                                onClick={() => {
                                                    const targetPath = currentEvent.bindRegistration
                                                        ? `/smreg?id=${currentEvent.id}`
                                                        : currentEvent.link;

                                                    if (currentEvent.registrationClosed) {
                                                        const isRegistered = currentEvent.registrations?.some((reg: any) => reg.uid === user?.uid);
                                                        if (!isRegistered) {
                                                            router.push(targetPath);
                                                            handleClose();
                                                            return;
                                                        }
                                                    }

                                                    if (!user) {
                                                        router.push(`/login?redirect=${encodeURIComponent(targetPath)}`);
                                                        return;
                                                    }

                                                    if (currentEvent.bindRegistration) {
                                                        router.push(`/smreg?id=${currentEvent.id}`);
                                                    } else {
                                                        window.open(currentEvent.link, '_blank');
                                                    }
                                                    handleClose();
                                                }}
                                                className={`h-12 rounded-2xl font-bold group cursor-pointer ${currentEvent.registrationClosed && !currentEvent.registrations?.some((reg: any) => reg.uid === user?.uid) ? 'bg-muted text-muted-foreground hover:bg-muted/80' : 'bg-primary hover:bg-primary/90 text-white'}`}
                                            >
                                                {currentEvent.registrationClosed && !currentEvent.registrations?.some((reg: any) => reg.uid === user?.uid) ? 'View Details' : currentEvent.buttonText}
                                                <ArrowRightIcon className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                            <Link
                                                href="/events"
                                                onClick={handleClose}
                                                className="text-[10px] font-black text-center text-muted-foreground hover:text-primary transition-colors uppercase tracking-widest"
                                            >
                                                View All Events
                                            </Link>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                                {/* Navigation Arrows */}
                                {activeEvents.length > 1 && (
                                    <div className="absolute bottom-6 left-6 md:left-auto md:right-10 flex gap-2">
                                        <button
                                            onClick={prevEvent}
                                            className="p-3 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/50 text-muted-foreground transition-all active:scale-95"
                                        >
                                            <ChevronLeftIcon className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={nextEvent}
                                            className="p-3 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/50 text-muted-foreground transition-all active:scale-95"
                                        >
                                            <ChevronRightIcon className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Dots Indicator */}
                                <div className="absolute bottom-10 right-28 hidden md:flex items-center gap-1.5">
                                    {activeEvents.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-4 bg-primary" : "w-1.5 bg-border"
                                                }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
