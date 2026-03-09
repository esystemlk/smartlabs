'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Clock, Sparkles, ArrowRight, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { getWebinarSettings, type WebinarSettings, DEFAULT_WEBINAR_SETTINGS } from '@/lib/services/webinar.service';

export function WebinarBanner() {
    const [isVisible, setIsVisible] = useState(false);
    const [settings, setSettings] = useState<WebinarSettings>(DEFAULT_WEBINAR_SETTINGS);
    const [isExpired, setIsExpired] = useState(false);
    const { firestore } = useFirebase();

    useEffect(() => {
        if (!firestore) return;

        const loadSettings = async () => {
            const webinarSettings = await getWebinarSettings(firestore);
            setSettings(webinarSettings);

            // Check if webinar date has passed
            const webinarDate = new Date(webinarSettings.date);
            webinarDate.setHours(23, 59, 59, 999);
            const now = new Date();

            if (now > webinarDate || !webinarSettings.isActive) {
                setIsExpired(true);
                return;
            }

            // Check if user dismissed the banner in this session
            const dismissed = sessionStorage.getItem('webinar-banner-dismissed');
            if (!dismissed) {
                // Show banner after a short delay
                const timer = setTimeout(() => setIsVisible(true), 1500);
                return () => clearTimeout(timer);
            }
        };

        loadSettings();
    }, [firestore]);

    const handleDismiss = () => {
        setIsVisible(false);
        sessionStorage.setItem('webinar-banner-dismissed', 'true');
    };

    if (isExpired || !settings.isActive) return null;

    // Format the date nicely
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleDismiss}
                        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm"
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 30 }}
                        transition={{ duration: 0.5, type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed inset-0 z-[201] flex items-center justify-center px-4 pointer-events-none"
                    >
                        <div className="relative w-full max-w-lg pointer-events-auto">
                            {/* Glow effect */}
                            <div className="absolute -inset-2 bg-gradient-to-r from-blue-400/30 via-sky-300/30 to-yellow-200/30 rounded-[36px] blur-2xl opacity-80 animate-pulse" />

                            {/* Card */}
                            <div className="relative bg-white dark:bg-slate-900 border border-blue-100 dark:border-slate-800 rounded-[32px] overflow-hidden shadow-2xl">
                                {/* Decorative top bar */}
                                <div className="h-1.5 bg-gradient-to-r from-blue-400 via-sky-300 to-yellow-300" />

                                {/* Close button */}
                                <button
                                    onClick={handleDismiss}
                                    className="absolute top-5 right-5 z-10 p-2 rounded-full bg-gray-100/80 dark:bg-slate-800/80 hover:bg-gray-200 dark:hover:bg-slate-700 transition-all text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    aria-label="Close webinar notice"
                                >
                                    <X className="h-4 w-4" />
                                </button>

                                <div className="p-8 pt-7">
                                    {/* Badge */}
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.2 }}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-sky-50 dark:from-blue-900/30 dark:to-sky-900/30 border border-blue-200/50 dark:border-blue-700/30 mb-5"
                                    >
                                        <motion.div
                                            animate={{ scale: [1, 1.3, 1] }}
                                            transition={{ duration: 2, repeat: Infinity }}
                                            className="w-2 h-2 rounded-full bg-green-500"
                                        />
                                        <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                            Free Webinar
                                        </span>
                                    </motion.div>

                                    {/* Title */}
                                    <motion.h2
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.25 }}
                                        className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight leading-tight mb-3"
                                    >
                                        {settings.title}
                                    </motion.h2>

                                    {/* Description */}
                                    <motion.p
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.3 }}
                                        className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-6"
                                    >
                                        {settings.description}
                                    </motion.p>

                                    {/* Event details */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.35 }}
                                        className="flex flex-wrap gap-3 mb-7"
                                    >
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/30">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                📅 {formatDate(settings.date)}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 px-4 py-2.5 bg-yellow-50 dark:bg-yellow-900/20 rounded-2xl border border-yellow-200 dark:border-yellow-800/30">
                                            <Clock className="h-4 w-4 text-yellow-600" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                ⏰ {settings.time} (Sri Lanka Time)
                                            </span>
                                        </div>
                                    </motion.div>

                                    {/* CTAs */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="flex flex-col sm:flex-row gap-3"
                                    >
                                        <Link href="/webinar/register" className="flex-1" onClick={handleDismiss}>
                                            <Button
                                                className="w-full h-12 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all group"
                                            >
                                                Register Now
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                        <Link href="/webinar" className="flex-1" onClick={handleDismiss}>
                                            <Button
                                                variant="outline"
                                                className="w-full h-12 rounded-2xl border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-sm transition-all group"
                                            >
                                                Learn More
                                                <ChevronRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </motion.div>
                                </div>

                                {/* Bottom decorative element */}
                                <div className="px-8 pb-6 pt-2">
                                    <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-600 uppercase tracking-widest">
                                        <Sparkles className="h-3 w-3" />
                                        <span>Limited Spots Available</span>
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
