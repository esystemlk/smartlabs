'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
    CalendarBlank,
    Clock,
    GlobeHemisphereWest,
    ArrowRight,
    Target,
    BookOpen,
    WarningCircle,
    ChatCenteredText,
    TrendUp,
    Sparkle,
    CheckCircle,
    UsersThree,
    Medal,
    ProjectorScreen,
    CaretRight,
} from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useFirebase } from '@/firebase';
import { getWebinarSettings, type WebinarSettings, DEFAULT_WEBINAR_SETTINGS } from '@/lib/services/webinar.service';

const learningPoints = [
    {
        icon: BookOpen,
        title: 'Reading: Fill in the Blanks',
        description: 'Master drag-and-drop and dropdown strategies for accurate word selection.',
        color: 'text-blue-500',
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-100 dark:border-blue-800/30',
    },
    {
        icon: Sparkle,
        title: 'Reading: Re-order Paragraphs',
        description: 'Use logical connectors and topic flow to rebuild the correct sequence.',
        color: 'text-sky-500',
        bg: 'bg-sky-50 dark:bg-sky-900/20',
        border: 'border-sky-100 dark:border-sky-800/30',
    },
    {
        icon: Target,
        title: 'Reading: Multiple Choice',
        description: 'Evidence-based selection for single/multiple answers without second-guessing.',
        color: 'text-purple-500',
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-100 dark:border-purple-800/30',
    },
    {
        icon: TrendUp,
        title: 'Time Management & Scanning',
        description: 'Skim/scan techniques to speed up while protecting accuracy.',
        color: 'text-emerald-500',
        bg: 'bg-emerald-50 dark:bg-emerald-900/20',
        border: 'border-emerald-100 dark:border-emerald-800/30',
    },
    {
        icon: WarningCircle,
        title: 'Avoid Common Reading Traps',
        description: 'Spot distractors, synonym traps, and polarity flips in questions and options.',
        color: 'text-amber-500',
        bg: 'bg-amber-50 dark:bg-amber-900/20',
        border: 'border-amber-100 dark:border-amber-800/30',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1, delayChildren: 0.2 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
};

export default function WebinarPage() {
    const [settings, setSettings] = useState<WebinarSettings>(DEFAULT_WEBINAR_SETTINGS);
    const { firestore } = useFirebase();

    useEffect(() => {
        if (!firestore) return;
        getWebinarSettings(firestore).then(setSettings);
    }, [firestore]);

    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="w-full">
            {/* ─── Hero Section ─── */}
            <section className="relative overflow-hidden py-20 md:py-32 bg-gradient-to-br from-white via-blue-50/50 to-sky-50/30 dark:from-slate-950 dark:via-blue-950/20 dark:to-slate-950">
                {/* Background decorations */}
                <div className="absolute inset-0 -z-10">
                    <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[120px]" />
                    <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-yellow-300/10 rounded-full blur-[100px]" />
                </div>

                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        {/* Badge */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-blue-50 via-sky-50 to-yellow-50 dark:from-blue-900/30 dark:via-sky-900/20 dark:to-yellow-900/20 border border-blue-200/60 dark:border-blue-700/30 mb-8"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.3, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="w-2 h-2 rounded-full bg-green-500"
                            />
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                                Free Online Webinar
                            </span>
                        </motion.div>

                        {/* Title */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.6 }}
                            className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6"
                        >
                            PTE Reading Strategy Webinar
                        </motion.h1>

                        {/* Subtitle */}
                            <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2, duration: 0.6 }}
                            className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-10"
                        >
                            Learn proven strategies to improve your PTE Reading scores with expert techniques for all task types.
                        </motion.p>

                        {/* Event Details Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.6 }}
                            className="max-w-2xl mx-auto"
                        >
                            <div className="relative">
                                <div className="absolute -inset-1 bg-gradient-to-r from-blue-400/20 via-sky-300/20 to-yellow-200/20 rounded-[28px] blur-xl" />
                                <Card className="relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-blue-100/80 dark:border-slate-800 rounded-[24px] shadow-xl overflow-hidden">
                                    {/* Top gradient bar */}
                                    <div className="h-1 bg-gradient-to-r from-blue-400 via-sky-400 to-yellow-300" />
                                    <CardContent className="p-8 sm:p-10">
                                        <div className="grid sm:grid-cols-3 gap-6 mb-8">
                                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-blue-50/80 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30">
                                                <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                                    <CalendarBlank weight="bold" className="h-6 w-6 text-blue-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-blue-500 uppercase tracking-wider mb-1">Date</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{formatDate(settings.date)}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-yellow-50/80 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30">
                                                <div className="w-12 h-12 rounded-2xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                                                    <Clock weight="bold" className="h-6 w-6 text-yellow-600" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-yellow-600 uppercase tracking-wider mb-1">Time</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{settings.time} (Sri Lanka)</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-sky-50/80 dark:bg-sky-900/10 border border-sky-100 dark:border-sky-800/30">
                                                <div className="w-12 h-12 rounded-2xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                                                    <ProjectorScreen weight="bold" className="h-6 w-6 text-sky-500" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-xs font-bold text-sky-500 uppercase tracking-wider mb-1">Mode</p>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">Online Webinar</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* CTA */}
                                        <Link href="/webinar/register">
                                            <Button className="w-full h-14 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all group">
                                                Register Now — It's Free!
                                                <ArrowRight weight="bold" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </CardContent>
                                </Card>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── What Students Will Learn ─── */}
            <section className="py-20 md:py-28 bg-white dark:bg-slate-950">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        {/* Section header */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-14"
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 mb-5">
                                <BookOpen weight="bold" className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">What You'll Learn</span>
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                                What Students Will Learn
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                                Gain insights and strategies from expert instructors that will transform your exam preparation approach.
                            </p>
                        </motion.div>

                        {/* Cards */}
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
                        >
                            {learningPoints.map((point, idx) => (
                                <motion.div key={idx} variants={itemVariants}>
                                    <Card className={`h-full ${point.bg} ${point.border} border rounded-[20px] hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group`}>
                                        <CardContent className="p-6">
                                            <div className={`w-12 h-12 rounded-2xl ${point.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                                <point.icon weight="bold" className={`h-6 w-6 ${point.color}`} />
                                            </div>
                                            <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2">{point.title}</h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{point.description}</p>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ─── Why Join Section ─── */}
            <section className="py-20 md:py-28 bg-gradient-to-br from-blue-50/50 via-white to-sky-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mb-14"
                        >
                            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
                                Why Join This Webinar?
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
                                Expert-led, completely free, and packed with actionable strategies.
                            </p>
                        </motion.div>

                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
                        >
                            {[
                                { icon: Medal, label: 'Expert Instructors', desc: 'Learn from PTE 90 scorers', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
                                { icon: UsersThree, label: 'Interactive Session', desc: 'Q&A and live discussion', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
                                { icon: Sparkle, label: '100% Free', desc: 'No hidden charges', color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
                                { icon: CheckCircle, label: 'Actionable Tips', desc: 'Apply strategies immediately', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
                            ].map((item, idx) => (
                                <motion.div key={idx} variants={itemVariants}>
                                    <div className={`text-center p-6 rounded-[20px] ${item.bg} border border-transparent hover:border-blue-200/50 dark:hover:border-blue-700/30 transition-all hover:-translate-y-1`}>
                                        <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center mx-auto mb-4`}>
                                            <item.icon weight="bold" className={`h-7 w-7 ${item.color}`} />
                                        </div>
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.label}</h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>

                        {/* Final CTA */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center mt-14"
                        >
                            <Link href="/webinar/register">
                                <Button className="h-14 px-10 rounded-2xl bg-gradient-to-r from-blue-500 to-sky-400 hover:from-blue-600 hover:to-sky-500 text-white font-bold text-base shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all group">
                                    Register Now — Secure Your Spot
                                    <ArrowRight weight="bold" className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </Link>
                            <p className="mt-4 text-sm text-gray-400 dark:text-gray-500">
                                No credit card required. 100% free.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>
        </div>
    );
}
