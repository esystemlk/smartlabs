'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, MapPin, ArrowRight, Sparkles, Target, Globe, Zap, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import Image from 'next/image';
import { events } from '@/lib/data/events';
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

const categoryColors = {
    Workshop: "bg-accent-1/10 text-accent-1 border-accent-1/20",
    Seminar: "bg-accent-2/10 text-accent-2 border-accent-2/20",
    "Live Class": "bg-accent-3/10 text-accent-3 border-accent-3/20",
    "Special Offer": "bg-accent-4/10 text-accent-4 border-accent-4/20",
};

export default function EventsPage() {
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
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
                    >
                        {events.map((event) => (
                            <motion.div
                                key={event.id}
                                variants={itemVariants}
                                className="group relative bg-card/50 backdrop-blur-xl border border-border/50 rounded-[32px] overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-xl"
                            >
                                {/* Image Wrap */}
                                <div className="relative h-64 overflow-hidden">
                                    <Image
                                        src={event.image}
                                        alt={event.title}
                                        fill
                                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                    <div className="absolute top-4 left-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${categoryColors[event.category]}`}>
                                            {event.category}
                                        </span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-8 space-y-4">
                                    <div className="flex items-center gap-3 text-xs font-bold text-primary">
                                        <Calendar className="h-4 w-4" />
                                        {event.date}
                                    </div>
                                    <h3 className="text-2xl font-black tracking-tight group-hover:text-primary transition-colors">
                                        {event.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                                        {event.description}
                                    </p>

                                    <div className="pt-4 flex items-center justify-between">
                                        <Button
                                            asChild
                                            className="rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold group/btn"
                                        >
                                            <Link href={event.link}>
                                                {event.buttonText}
                                                <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Link>
                                        </Button>
                                        <div className="h-10 w-10 rounded-full border border-border/50 flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors cursor-pointer">
                                            <Zap className="h-4 w-4" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
