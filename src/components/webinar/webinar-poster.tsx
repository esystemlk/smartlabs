'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CalendarBlank, Clock, Sparkle, ArrowRight, Star, UsersThree, ArrowUpRight } from '@phosphor-icons/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useFirebase } from '@/firebase';
import { getWebinarSettings, type WebinarSettings, DEFAULT_WEBINAR_SETTINGS } from '@/lib/services/webinar.service';

export function WebinarPoster() {
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
            }
        };

        loadSettings();
    }, [firestore]);

    if (isExpired || !settings.isActive) return null;

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <section className="relative py-12 px-4 overflow-hidden">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="relative bg-white dark:bg-slate-900 border-2 border-blue-50 dark:border-slate-800 rounded-[48px] overflow-hidden shadow-[0_32px_64px_-16px_rgba(59,130,246,0.12)]"
                >
                    {/* Background Decorative Elements */}
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 to-transparent dark:from-blue-900/10 pointer-events-none" />
                    <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-100/30 dark:bg-yellow-900/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-100/30 dark:bg-blue-900/10 rounded-full blur-3xl translate-x-1/4 translate-y-1/4 pointer-events-none" />

                    <div className="relative grid lg:grid-cols-2 gap-12 items-center p-8 sm:p-12 lg:p-16">
                        {/* Left Content */}
                        <div className="space-y-8">
                            <div className="space-y-4">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200/50 dark:border-blue-700/30"
                                >
                                    <Sparkle weight="fill" className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                    <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                        Free PTE Strategy Webinar
                                    </span>
                                </motion.div>

                                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white leading-[1.1] tracking-tight">
                                    Unlock Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-sky-500">Dream Score</span> in PTE
                                </h2>

                                <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl">
                                    {(settings.description || "Join our expert-led session to master the latest PTE strategies and techniques. Get the score you need for your visa or university application.")}
                                </p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                                    <div className="p-3 w-fit rounded-2xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 mb-4">
                                        <CalendarBlank weight="bold" className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Webinar Date</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-white">{formatDate(settings.date)}</p>
                                    </div>
                                </div>

                                <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors hover:border-blue-200 dark:hover:border-blue-800">
                                    <div className="p-3 w-fit rounded-2xl bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400 mb-4">
                                        <Clock weight="bold" className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Webinar Time</p>
                                        <p className="text-lg font-black text-gray-900 dark:text-white">{settings.time} (Sri Lanka Time)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link href="/webinar/register">
                                    <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white font-black text-lg shadow-xl shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
                                        Register Now
                                        <ArrowRight weight="bold" className="ml-2 h-5 w-5" />
                                    </Button>
                                </Link>
                                <Link href="/webinar">
                                    <Button variant="outline" className="w-full sm:w-auto h-14 px-10 rounded-2xl border-2 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 font-black text-lg transition-all">
                                        Learn More
                                    </Button>
                                </Link>
                            </div>
                        </div>

                        {/* Right Visual Postcard */}
                        <div className="relative lg:block hidden">
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="relative z-10 p-4"
                            >
                                <div className="relative aspect-[4/5] rounded-[40px] overflow-hidden shadow-2xl group">
                                    <img
                                        src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&q=80&w=800"
                                        alt="PTE Success"
                                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/20 to-transparent" />

                                    <div className="absolute bottom-8 left-8 right-8">
                                        <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20 text-white space-y-4">
                                            <div className="flex -space-x-3">
                                                {[1, 2, 3, 4].map(i => (
                                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-blue-600 bg-slate-200 overflow-hidden">
                                                        <img src={`https://i.pravatar.cc/150?u=${i}`} alt="Student" />
                                                    </div>
                                                ))}
                                                <div className="w-10 h-10 rounded-full border-2 border-blue-600 bg-blue-500 flex items-center justify-center text-[10px] font-black">
                                                    +2k
                                                </div>
                                            </div>
                                            <p className="text-sm font-bold opacity-90 leading-tight">
                                                Join students who have already registered for this life-changing session!
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Floating Action Cards */}
                                <motion.div
                                    animate={{ y: [0, 5, 0] }}
                                    transition={{ duration: 3, repeat: Infinity, delay: 1 }}
                                    className="absolute -top-6 -right-6 p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-blue-50 dark:border-slate-700 flex items-center gap-4"
                                >
                                    <div className="p-3 rounded-2xl bg-yellow-400 text-white">
                                        <Star weight="fill" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Success Rate</p>
                                        <p className="text-xl font-black text-gray-900 dark:text-white">95% Pass</p>
                                    </div>
                                </motion.div>

                                <motion.div
                                    animate={{ x: [0, -5, 0] }}
                                    transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                                    className="absolute -bottom-6 -left-6 p-6 rounded-3xl bg-white dark:bg-slate-800 shadow-xl border border-blue-50 dark:border-slate-700 flex items-center gap-4"
                                >
                                    <div className="p-3 rounded-2xl bg-blue-600 text-white">
                                        <UsersThree weight="bold" className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-xl font-black text-gray-900 dark:text-white">PTE Expert</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div >
        </section >
    );
}
