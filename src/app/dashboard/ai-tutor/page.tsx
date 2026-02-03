'use client';

import React from 'react';
import {
    Bot,
    Sparkles,
    ArrowRight,
    GraduationCap,
    Zap,
    ShieldCheck,
    Users,
    ArrowLeft,
    MessageSquare,
    TrendingUp,
    Globe,
    Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const tutorCourses = [
    {
        id: 'pte',
        name: 'PTE Academic',
        tutor: 'AI Alpha',
        specialization: 'Advanced Speaking & Exam Strategy',
        students: '12.4k',
        rating: '4.9/5',
        color: 'text-accent-1',
        bg: 'bg-accent-1/10',
        border: 'border-accent-1/20',
        description: 'Expert AI coaching focused on mastering the PTE scoring patterns for a perfect 90/90.',
        stats: { pass: '98%', speed: '24ms' }
    },
    {
        id: 'ielts',
        name: 'IELTS Mastery',
        tutor: 'IELTS Sage',
        specialization: 'Band 9 Writing & Structural Flow',
        students: '8.2k',
        rating: '4.8/5',
        color: 'text-accent-2',
        bg: 'bg-accent-2/10',
        border: 'border-accent-2/20',
        description: 'Strategic Band 9.0 coaching for Academic and General Training with advanced language structures.',
        stats: { pass: '96%', speed: '30ms' }
    },
    {
        id: 'celpip',
        name: 'CELPIP Elite',
        tutor: 'CELPIP Pro',
        specialization: 'Functional Language Practice',
        students: '5.1k',
        rating: '4.9/5',
        color: 'text-accent-3',
        bg: 'bg-accent-3/10',
        border: 'border-accent-3/20',
        description: 'Practical English mastery for Canadian immigration using real-life situational training.',
        stats: { pass: '99%', speed: '18ms' }
    }
];

export default function AITutorLanding() {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden">
            {/* Animated Background Orbs */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.5, 0.3],
                        x: [0, 50, 0],
                        y: [0, -50, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity }}
                    className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px]"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        opacity: [0.2, 0.4, 0.2],
                        x: [0, -30, 0],
                        y: [0, 40, 0]
                    }}
                    transition={{ duration: 15, repeat: Infinity }}
                    className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] rounded-full bg-accent-1/20 blur-[100px]"
                />
            </div>

            <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                    <div className="space-y-6 max-w-2xl">
                        <Button asChild variant="ghost" className="hover:bg-primary/5 group -ml-4">
                            <Link href="/dashboard" className="flex items-center text-muted-foreground font-bold text-xs uppercase tracking-widest">
                                <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
                            </Link>
                        </Button>
                        <div className="flex items-start gap-6">
                            <motion.div
                                whileHover={{ rotate: 360 }}
                                transition={{ duration: 0.8 }}
                                className="hidden sm:flex h-20 w-20 shrink-0 rounded-[2.5rem] bg-primary/10 items-center justify-center border-2 border-primary/20 shadow-[0_0_40px_rgba(79,70,229,0.2)]"
                            >
                                <Bot className="h-10 w-10 text-primary" />
                            </motion.div>
                            <div>
                                <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight leading-[0.9] mb-4">
                                    Learn with <span className="text-primary italic relative">
                                        AI Tutor
                                        <motion.span
                                            initial={{ width: 0 }}
                                            animate={{ width: '100%' }}
                                            transition={{ delay: 0.5, duration: 1 }}
                                            className="absolute bottom-0 left-0 h-2 bg-primary/20 -z-10"
                                        />
                                    </span>
                                </h1>
                                <p className="text-muted-foreground font-bold italic flex items-center gap-2 text-sm sm:text-base">
                                    <Sparkles className="h-5 w-5 text-accent-1" /> Smart Adaptive Coaching for Exam Success
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-4 w-full lg:w-auto">
                        <div className="flex-1 lg:flex-none glass-card px-8 py-6 rounded-[2.5rem] border-2 border-border/50 flex flex-col items-center bg-background/40 backdrop-blur-xl shadow-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
                                <TrendingUp className="h-3 w-3 text-green-500" /> Success Rate
                            </span>
                            <span className="text-3xl font-black text-primary italic">98.2%</span>
                        </div>
                        <div className="flex-1 lg:flex-none glass-card px-8 py-6 rounded-[2.5rem] border-2 border-border/50 flex flex-col items-center bg-background/40 backdrop-blur-xl shadow-xl">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2 flex items-center gap-2">
                                <Flame className="h-3 w-3 text-orange-500" /> Availability
                            </span>
                            <span className="text-3xl font-black text-accent-1 italic">24 / 7</span>
                        </div>
                    </div>
                </div>

                {/* Hero Feature Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { icon: Zap, title: 'Neural Real-Time', desc: 'Instant phonetic and logic corrections as you type or speak.', accent: 'bg-accent-1/10 text-accent-1' },
                        { icon: GraduationCap, title: 'Adaptive Syllabi', desc: 'Your learning roadmap mutates based on session performance.', accent: 'bg-primary/10 text-primary' },
                        { icon: ShieldCheck, title: 'Matrix Prediction', desc: 'AI-simulated exam questions based on current board trends.', accent: 'bg-green-500/10 text-green-500' }
                    ].map((item, idx) => (
                        <motion.div
                            key={idx}
                            whileHover={{ scale: 1.02, y: -5 }}
                            className="p-8 rounded-[3rem] bg-card/40 backdrop-blur-xl border-2 border-border/50 flex flex-col gap-6 shadow-lg group hover:border-primary/50 transition-all"
                        >
                            <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center border shadow-inner transition-transform group-hover:rotate-12", item.accent)}>
                                <item.icon className="h-7 w-7" />
                            </div>
                            <div>
                                <h3 className="font-black text-xl italic mb-2">{item.title}</h3>
                                <p className="text-xs font-bold leading-relaxed text-muted-foreground uppercase tracking-wider">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Course Selection Matrix */}
                <div className="space-y-10 pt-10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-3xl font-black font-display tracking-tight flex items-center gap-3 italic">
                            <Users className="h-8 w-8 text-primary" /> Global <span className="text-primary underline">Faculty Matrix</span>
                        </h2>
                        <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 font-black text-[10px] tracking-widest uppercase">
                            3 Active Neural Nodes
                        </Badge>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {tutorCourses.map((course, idx) => (
                            <Link key={course.id} href={`/dashboard/ai-tutor/${course.id}`}>
                                <SpotlightCard className="h-full rounded-[3.5rem] border-2 bg-card/40 backdrop-blur-3xl p-10 flex flex-col group relative overflow-hidden transition-all duration-700 hover:-translate-y-4 hover:shadow-[0_40px_80px_rgba(0,0,0,0.3)]">
                                    <div className={`absolute top-0 right-0 w-48 h-48 ${course.bg} blur-[80px] opacity-30 group-hover:opacity-70 transition-opacity duration-700`} />

                                    <div className="flex justify-between items-start mb-10">
                                        <div className={cn("w-16 h-16 rounded-[1.8rem] flex items-center justify-center border shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500", course.bg, course.border)}>
                                            <Bot className={cn("h-8 w-8", course.color)} />
                                        </div>
                                        <div className="text-right">
                                            <div className="text-[2rem] font-black italic leading-none text-primary/10 group-hover:text-primary/20 transition-colors">0{idx + 1}</div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1">Matrix Node</div>
                                        </div>
                                    </div>

                                    <div className="flex-grow space-y-6">
                                        <div>
                                            <div className="flex items-center gap-3 mb-3">
                                                <Badge variant="outline" className={cn("rounded-xl px-4 py-1.5 text-[10px] font-black uppercase shadow-sm", course.border, course.color)}>
                                                    MASTER {course.tutor}
                                                </Badge>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                    <Users className="h-3.5 w-3.5" /> {course.students}
                                                </span>
                                            </div>
                                            <h3 className="text-4xl font-black leading-[0.9] group-hover:text-primary transition-colors italic">{course.name}</h3>
                                        </div>

                                        <p className="text-sm font-bold text-muted-foreground leading-relaxed transition-all group-hover:text-foreground">
                                            {course.description}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Pass Rate</div>
                                                <div className="text-sm font-black italic">{course.stats.pass}</div>
                                            </div>
                                            <div className="p-4 rounded-2xl bg-muted/40 border border-border/50">
                                                <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mb-1">Latency</div>
                                                <div className="text-sm font-black italic">{course.stats.speed}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-12 pt-8 border-t border-border/50 flex justify-between items-center group/btn">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">User Rating</span>
                                            <span className="text-base font-black text-primary flex items-center gap-1">
                                                ★ {course.rating}
                                            </span>
                                        </div>
                                        <Button size="icon" className="rounded-[1.5rem] h-14 w-14 bg-primary shadow-xl shadow-primary/20 group-hover/btn:scale-110 group-hover/btn:rotate-12 transition-all">
                                            <ArrowRight className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </SpotlightCard>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Live Activity Trace (Advanced Feature) */}
                <Card className="rounded-[4rem] border-2 bg-[#020617] p-8 lg:p-16 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/30 via-transparent to-transparent opacity-60" />
                    <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div>
                                <Badge className="bg-primary mb-4 px-4 py-1.5 font-black uppercase tracking-widest text-[9px] rounded-full">Neural Stats</Badge>
                                <h3 className="text-4xl lg:text-5xl font-black font-display italic leading-tight">Syncing Students to <br /><span className="text-primary italic">Global Success</span></h3>
                            </div>
                            <p className="text-blue-100/60 font-bold leading-relaxed max-w-lg text-sm sm:text-base italic uppercase tracking-wider">
                                Our AI core analyzed <span className="text-white">4.2M transcription nodes</span> in the last 24 hours. Join the matrix and achieve your target score.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button className="h-14 px-10 rounded-2xl bg-primary text-white font-black hover:scale-105 active:scale-95 transition-all tracking-widest text-xs">
                                    INITIALIZE TRAINING <Zap className="ml-2 h-4 w-4 fill-white" />
                                </Button>
                                <Button variant="outline" className="h-14 px-10 rounded-2xl border-white/20 text-white font-black hover:bg-white/5 tracking-widest text-xs">
                                    AUDIT TESTIMONIALS
                                </Button>
                            </div>
                        </div>

                        {/* Abstract Visual Stats */}
                        <div className="hidden lg:grid grid-cols-2 gap-4">
                            {[
                                { label: 'Active Sessions', val: '2,481', icon: Activity },
                                { label: 'Logic Corrections', val: '1.2M+', icon: Brain },
                                { label: 'Global Nodes', val: '52', icon: Globe },
                                { label: 'Pass Integrity', val: '99.9%', icon: ShieldCheck }
                            ].map((s, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/10 transition-colors"
                                >
                                    <s.icon className="h-8 w-8 text-primary opacity-50" />
                                    <div>
                                        <div className="text-2xl font-black italic">{s.val}</div>
                                        <div className="text-[8px] font-black uppercase tracking-widest opacity-40 mt-1">{s.label}</div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}

const Activity = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>
)

const Brain = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-2.04Z" /><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-2.04Z" /></svg>
)
