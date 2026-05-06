'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Calendar, ArrowRight, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function WorkshopPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        // Only show once per session
        const hasSeenPopup = sessionStorage.getItem('hasSeenWorkshopPopup');
        
        if (!hasSeenPopup && !pathname.includes('/admin') && !pathname.includes('/dashboard')) {
            const timer = setTimeout(() => {
                setIsOpen(true);
            }, 5000); // 5 seconds delay

            return () => clearTimeout(timer);
        }
    }, [pathname]);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('hasSeenWorkshopPopup', 'true');
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-lg overflow-hidden bg-white dark:bg-slate-900 rounded-[40px] shadow-2xl border border-primary/20"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary via-indigo-600 to-accent-1 opacity-10" />
                        
                        <button 
                            onClick={handleClose}
                            className="absolute top-6 right-6 p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>

                        <div className="p-10 pt-16 space-y-8">
                            <div className="space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest">
                                    <Sparkles className="h-4 w-4" />
                                    Free Live Training
                                </div>
                                <h2 className="text-4xl font-black font-headline tracking-tight leading-[1.1]">
                                    Master PTE in our <br />
                                    <span className="text-primary italic">Next Free Workshop!</span>
                                </h2>
                                <p className="text-muted-foreground font-medium leading-relaxed">
                                    Join our experts for a deep dive into real exam strategies. Limited seats available for this month's session.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <Calendar className="h-5 w-5 text-primary mb-2" />
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Upcoming</p>
                                    <p className="text-sm font-black">Monthly Series</p>
                                </div>
                                <div className="p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                    <Video className="h-5 w-5 text-red-500 mb-2" />
                                    <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Platform</p>
                                    <p className="text-sm font-black">YouTube Live</p>
                                </div>
                            </div>

                            <Button 
                                asChild
                                className="w-full h-16 rounded-2xl text-lg font-black shadow-lg shadow-primary/20"
                                onClick={handleClose}
                            >
                                <Link href="/workshops">
                                    Reserve My Free Seat <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                            
                            <p className="text-center text-xs text-muted-foreground font-bold uppercase tracking-widest">
                                ⚡ Join 5,000+ students globally
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
