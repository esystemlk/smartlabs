'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, User, Users, CheckCircle2, ArrowRight, Play, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { initializeFirebase } from '@/firebase';
import { getActiveWorkshops, Workshop } from '@/lib/services/workshop.service';

export default function WorkshopsPage() {
    const [workshops, setWorkshops] = useState<Workshop[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWorkshops = async () => {
            const { firestore } = initializeFirebase();
            const data = await getActiveWorkshops(firestore);
            setWorkshops(data);
            setLoading(false);
        };
        fetchWorkshops();
    }, []);

    return (
        <div className="w-full relative overflow-hidden bg-slate-50 dark:bg-[#020617] min-h-screen">
            {/* Hero Section */}
            <section className="relative pt-32 pb-24 overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-accent-1/10">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-4xl mx-auto text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-black uppercase tracking-widest"
                        >
                            <Sparkles className="h-4 w-4" />
                            Free Monthly Knowledge Series
                        </motion.div>
                        <h1 className="text-6xl md:text-8xl font-black font-headline tracking-tighter leading-[0.9] text-slate-900 dark:text-white">
                            SmartLabs Free <br />
                            <span className="gradient-text italic">Monthly Workshops</span>
                        </h1>
                        <p className="text-xl md:text-2xl text-muted-foreground font-medium leading-relaxed max-w-2xl mx-auto">
                            Master PTE & CELPIP with real exam strategies from international experts. Join live, learn fast, and unlock exclusive study notes.
                        </p>
                    </div>
                </div>
                
                {/* Decorative Elements */}
                <div className="absolute top-0 left-0 w-full h-full pointer-events-none -z-10">
                    <div className="absolute top-1/4 -left-1/4 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
                    <div className="absolute bottom-1/4 -right-1/4 w-[500px] h-[500px] bg-accent-1/20 blur-[120px] rounded-full animate-pulse delay-700" />
                </div>
            </section>

            {/* Workshops List */}
            <section className="py-24">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col gap-12">
                        {loading ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {[1, 2, 3].map(i => (
                                    <Card key={i} className="h-[450px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded-[40px] border-none" />
                                ))}
                            </div>
                        ) : workshops.length > 0 ? (
                            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {workshops.map((workshop, i) => (
                                    <motion.div
                                        key={workshop.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.1 }}
                                    >
                                        <Card className="group h-full flex flex-col rounded-[40px] border-none bg-white dark:bg-slate-900 shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500">
                                            {/* Thumbnail */}
                                            <div className="relative h-56 w-full overflow-hidden">
                                                {workshop.thumbnailUrl ? (
                                                    <Image 
                                                        src={workshop.thumbnailUrl} 
                                                        alt={workshop.title} 
                                                        fill 
                                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                                                    />
                                                ) : (
                                                    <div className="h-full w-full bg-gradient-to-br from-primary to-accent-1 flex items-center justify-center">
                                                        <Play className="h-16 w-16 text-white opacity-50" />
                                                    </div>
                                                )}
                                                <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-white/20 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                                    Free Workshop
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="p-8 flex flex-col flex-grow space-y-6">
                                                <div className="space-y-3">
                                                    <h3 className="text-2xl font-black font-headline tracking-tight group-hover:text-primary transition-colors line-clamp-2">
                                                        {workshop.title}
                                                    </h3>
                                                    <div className="flex flex-wrap gap-4 text-sm font-bold text-muted-foreground">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-primary" />
                                                            {new Date(workshop.date instanceof Date ? workshop.date : (workshop.date as any).toDate()).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="h-4 w-4 text-primary" />
                                                            {workshop.time}
                                                        </div>
                                                    </div>
                                                </div>

                                                <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                                                    {workshop.description}
                                                </p>

                                                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 mt-auto flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                            <User className="h-4 w-4 text-primary" />
                                                        </div>
                                                        <span className="text-sm font-black">{workshop.instructor}</span>
                                                    </div>
                                                    <Button variant="ghost" className="rounded-full font-black text-primary hover:bg-primary/5 p-0" asChild>
                                                        <Link href={`/workshops/${workshop.id}`}>
                                                            Details <ArrowRight className="h-4 w-4 ml-2" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 space-y-6">
                                <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto">
                                    <Calendar className="h-12 w-12 text-slate-400" />
                                </div>
                                <h3 className="text-2xl font-black">No Upcoming Workshops</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">We're planning our next sessions. Stay tuned or join our newsletter for updates!</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden">
                <div className="container mx-auto px-4 relative">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tight leading-[0.9]">
                                Why Join Our <br />
                                <span className="text-primary italic">Live Sessions?</span>
                            </h2>
                            <div className="space-y-6">
                                {[
                                    { title: 'Free Access', desc: '100% free monthly training for all students.', icon: Users },
                                    { title: 'Free Study Notes', desc: 'Unlock exclusive PDFs and materials after the session.', icon: FileText },
                                    { title: 'Real Exam Strategies', desc: 'Learn proven techniques to boost your scores fast.', icon: CheckCircle2 },
                                    { title: 'Expert Guidance', desc: 'Interact with international instructors in real-time.', icon: User },
                                ].map((item, i) => (
                                    <motion.div 
                                        key={i}
                                        initial={{ opacity: 0, x: -20 }}
                                        whileInView={{ opacity: 1, x: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex gap-4 p-6 rounded-3xl bg-white/5 border border-white/10"
                                    >
                                        <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shrink-0">
                                            <item.icon className="h-6 w-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black">{item.title}</h4>
                                            <p className="text-white/60 text-sm mt-1">{item.desc}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                        <div className="relative h-[600px] rounded-[48px] overflow-hidden border border-white/10">
                             <Image 
                                src="https://picsum.photos/800/1200?education" 
                                alt="Learning" 
                                fill 
                                sizes="(max-width: 1024px) 100vw, 50vw"
                                className="object-cover opacity-60"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
                            <div className="absolute bottom-12 left-12 right-12 p-8 rounded-[32px] bg-white/10 backdrop-blur-xl border border-white/20">
                                <p className="text-2xl font-black leading-tight italic">
                                    "The strategies shared in the free workshop helped me jump from Band 6 to 7.5 in just one session!"
                                </p>
                                <p className="mt-4 text-primary font-bold">— Maria S., PTE Student</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
