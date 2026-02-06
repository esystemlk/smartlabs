'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Calendar, ArrowRight, Sparkles } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Event, events } from '@/lib/data/events';

export function EventPopup() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [hasSeen, setHasSeen] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            const shown = sessionStorage.getItem('event-popup-shown');
            if (!shown) {
                setIsOpen(true);
            }
        }, 2000); // Show after 2 seconds

        return () => clearTimeout(timer);
    }, []);

    const handleClose = () => {
        setIsOpen(false);
        sessionStorage.setItem('event-popup-shown', 'true');
    };

    const nextEvent = () => {
        setCurrentIndex((prev) => (prev + 1) % events.length);
    };

    const prevEvent = () => {
        setCurrentIndex((prev) => (prev - 1 + events.length) % events.length);
    };

    const currentEvent = events[currentIndex];

    if (!currentEvent) return null;

    return (
        <AnimatePresence>
            {isOpen && (
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
                        className="relative w-full max-w-2xl bg-card border border-border/50 rounded-[40px] shadow-2xl overflow-hidden pointer-events-auto"
                    >
                        <div className="flex flex-col md:flex-row h-full">
                            {/* Image Side */}
                            <div className="relative w-full md:w-1/2 h-64 md:h-auto overflow-hidden">
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
                                    <X className="h-5 w-5" />
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
                                            <Calendar className="h-4 w-4" />
                                            {currentEvent.date}
                                        </div>

                                        <h2 className="text-3xl font-black tracking-tight leading-tight">
                                            {currentEvent.title}
                                        </h2>

                                        <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                                            {currentEvent.description}
                                        </p>

                                        <div className="pt-4 flex flex-col gap-3">
                                            <Button
                                                asChild
                                                className="h-12 rounded-2xl bg-primary hover:bg-primary/90 text-white font-bold group"
                                            >
                                                <Link href={currentEvent.link} onClick={handleClose}>
                                                    {currentEvent.buttonText}
                                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </Link>
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
                                {events.length > 1 && (
                                    <div className="absolute bottom-6 left-6 md:left-auto md:right-10 flex gap-2">
                                        <button
                                            onClick={prevEvent}
                                            className="p-3 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/50 text-muted-foreground transition-all active:scale-95"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={nextEvent}
                                            className="p-3 rounded-xl bg-muted/50 hover:bg-primary/10 hover:text-primary border border-border/50 text-muted-foreground transition-all active:scale-95"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                )}

                                {/* Dots Indicator */}
                                <div className="absolute bottom-10 right-28 hidden md:flex items-center gap-1.5">
                                    {events.map((_, i) => (
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
