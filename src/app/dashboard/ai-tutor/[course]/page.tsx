'use client';

import React from 'react';
import {
    Bot,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    CheckCircle2,
    BookOpen,
    MessageSquare,
    Zap,
    Clock,
    Layout,
    Star,
    ShieldAlert,
    ChevronRight,
    Target,
    Activity,
    Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

const courseData = {
    pte: {
        name: 'PTE Academic',
        tutor: 'AI Alpha',
        tagline: 'High-Accuracy PTE Exam Training',
        rating: '4.9',
        duration: '45 Hours',
        modules: 18,
        difficulty: 'Advanced',
        color: 'text-accent-1',
        bg: 'bg-accent-1/10',
        border: 'border-accent-1/20',
        accent: 'accent-1',
        description: 'Complete mastery of the Pearson exam patterns. We focus on pronunciation, writing templates, and keyword identification.',
        roadmap: [
            { step: 1, title: 'Expert Diagnostic', desc: 'Full AI-powered assessment of your current level across all 20 task types.' },
            { step: 2, title: 'Speaking Skills', desc: 'Optimization of oral fluency and pronunciation skills for the computer-based test.' },
            { step: 3, title: 'Strategic Writing', desc: 'Mastering the essay and summary templates for consistent 90/90 results.' },
            { step: 4, title: 'Speed Reading Patterns', desc: 'Decoding complex passages with rapid keyword-finding strategies.' },
            { step: 5, title: 'Fluency Mastery', desc: 'Refining your speaking and listening skills for SST and Dictation tasks under pressure.' }
        ]
    },
    ielts: {
        name: 'IELTS Mastery',
        tutor: 'IELTS Sage',
        tagline: 'Band 9.0 Strategic Study Plan',
        rating: '4.8',
        duration: '60 Hours',
        modules: 24,
        difficulty: 'Comprehensive',
        color: 'text-accent-2',
        bg: 'bg-accent-2/10',
        border: 'border-accent-2/20',
        accent: 'accent-2',
        description: 'High-level training for Academic and General Training. Focus on lexical variety, grammatical precision, and structured essay flow.',
        roadmap: [
            { step: 1, title: 'Band Predictor', desc: 'Placement test using Cambridge-style patterns to calculate your current progress.' },
            { step: 2, title: 'Vocabulary Skills', desc: 'Integration of academic synonyms and idiomatic language for Band 7+ Writing.' },
            { step: 3, title: 'Cohesion Patterns', desc: 'Building seamless logic flow in Task 1 reports and Task 2 essays.' },
            { step: 4, title: 'Speaking Simulation', desc: 'Real-time mock interviews with immediate speaking and grammar feedback.' },
            { step: 5, title: 'Exam Strategies', desc: 'Decoding the trick patterns in Reading and Listening multiple-choice tasks.' }
        ]
    },
    celpip: {
        name: 'CELPIP Elite',
        tutor: 'CELPIP Pro',
        tagline: 'Canadian Practical English Prep',
        rating: '4.9',
        duration: '35 Hours',
        modules: 12,
        difficulty: 'Specialized',
        color: 'text-accent-3',
        bg: 'bg-accent-3/10',
        border: 'border-accent-3/20',
        accent: 'accent-3',
        description: 'Practical training for Canadian immigration. Focus on daily life scenarios, descriptive accuracy, and email etiquette.',
        roadmap: [
            { step: 1, title: 'Practical English', desc: 'Understanding everyday Canadian scenarios used in the Speaking and Listening skills.' },
            { step: 2, title: 'Time Management', desc: 'Strategic training to fit complex responses into the rigid 60-second windows.' },
            { step: 3, title: 'Descriptive Skills', desc: 'Decoding images and graphs for the CELPIP Speaking Part 3 & 4 patterns.' },
            { step: 4, title: 'Writing Framework', desc: 'Mastering the formal and semi-formal functional writing styles.' },
            { step: 5, title: 'Final Mock Test', desc: 'Full-length simulation with performance-based score prediction.' }
        ]
    }
};

export default function CourseDetailLanding() {
    const params = useParams();
    const router = useRouter();
    const courseId = params.course as string;
    const data = (courseData as any)[courseId];

    if (!data) return null;

    return (
        <div className="min-h-screen bg-background relative selection:bg-primary/20">
            {/* Global Gradient Overlays */}
            <div className={`absolute top-0 right-0 w-[50%] h-[30%] ${data.bg} blur-[120px] opacity-20 pointer-events-none`} />

            <div className="relative z-10 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-16 animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Header Section */}
                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
                    <div className="space-y-6 max-w-3xl">
                        <Button onClick={() => router.back()} variant="ghost" className="hover:bg-primary/5 group -ml-4 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Exit to Tutors
                        </Button>
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 text-center sm:text-left">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.5 }}
                                className={cn("h-24 w-24 rounded-[2.5rem] flex items-center justify-center border-2 shadow-2xl shrink-0 group", data.bg, data.border)}
                            >
                                <Bot className={cn("h-12 w-12 group-hover:scale-110 transition-transform", data.color)} />
                            </motion.div>
                            <div className="space-y-3">
                                <div className="flex flex-wrap justify-center sm:justify-start items-center gap-3">
                                    <Badge className="bg-primary px-4 py-1 font-black uppercase tracking-wider text-[10px] rounded-xl">{data.tutor}</Badge>
                                    <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest bg-muted/50 px-3 py-1 rounded-xl border border-border/50">
                                        <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /> {data.rating} RATING
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-xl border border-green-500/20">
                                        <Activity className="h-3.5 w-3.5" /> LIVE PRACTICE
                                    </div>
                                </div>
                                <h1 className="text-4xl sm:text-6xl font-black font-display tracking-tight leading-none">
                                    {data.name} <br /><span className="text-primary italic">Success Syllabus</span>
                                </h1>
                                <p className="text-muted-foreground font-black italic text-sm uppercase tracking-widest">{data.tagline}</p>
                            </div>
                        </div>
                    </div>

                    <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-4">
                        <Button asChild className="h-20 px-12 rounded-[2rem] bg-primary text-base font-black tracking-[0.2em] shadow-[0_20px_50px_rgba(79,70,229,0.3)] hover:scale-105 active:scale-95 transition-all flex-grow sm:flex-none">
                            <Link href={`/dashboard/ai-tutor/${courseId}/chat`}>
                                START LEARNING NOW <Sparkles className="ml-3 h-5 w-5 fill-white" />
                            </Link>
                        </Button>
                        <Button variant="outline" size="icon" className="hidden sm:flex h-20 w-20 rounded-[2rem] border-2 border-border/50 hover:bg-primary/5 active:scale-95 transition-all">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                        </Button>
                    </div>
                </div>

                {/* Course Matrix Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                    {[
                        { icon: Clock, label: 'Preparation Time', value: data.duration, color: 'text-accent-1' },
                        { icon: Layers, label: 'Skill Modules', value: data.modules, color: 'text-accent-2' },
                        { icon: Target, label: 'Test Difficulty', value: data.difficulty, color: 'text-accent-3' },
                        { icon: ShieldAlert, label: 'Tutor Level', value: 'Expert Class AI', color: 'text-primary' }
                    ].map((stat, i) => (
                        <Card key={i} className="rounded-[2.5rem] border-2 bg-background/50 backdrop-blur-md p-6 lg:p-10 border-border/50 shadow-lg hover:border-primary/50 transition-all duration-500 group">
                            <CardContent className="p-0 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                                <div className={cn("h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center border shadow-inner group-hover:scale-110 transition-transform", stat.color)}>
                                    <stat.icon className="h-7 w-7" />
                                </div>
                                <div>
                                    <div className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1.5 opacity-60">{stat.label}</div>
                                    <div className="text-xl font-black italic">{stat.value}</div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    {/* Roadmap Interactive Visualization */}
                    <div className="xl:col-span-8 space-y-10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-black font-display tracking-tight flex items-center gap-4 italic capitalize">
                                <Zap className="h-10 w-10 text-primary animate-pulse" /> Your <span className="text-primary underline underline-offset-8">Success Roadmap</span>
                            </h2>
                            <div className="hidden sm:flex h-[2px] grow mx-8 bg-gradient-to-r from-primary/10 via-primary/50 to-transparent" />
                        </div>

                        <div className="space-y-6 relative">
                            {/* Vertical Line Connector */}
                            <div className="absolute left-[30px] top-6 bottom-6 w-1 bg-gradient-to-b from-primary via-accent-3 to-transparent opacity-10 hidden sm:block" />

                            {data.roadmap.map((item: any, idx: number) => (
                                <motion.div
                                    initial={{ opacity: 0, x: -30 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    key={idx}
                                    className="flex items-start gap-4 sm:gap-10 group"
                                >
                                    <div className={cn("z-10 h-16 w-16 shrink-0 rounded-[1.8rem] flex items-center justify-center font-black text-sm transition-all duration-500 relative",
                                        idx === 0
                                            ? 'bg-primary text-white shadow-[0_10px_30px_rgba(79,70,229,0.4)]'
                                            : 'bg-card border-2 border-border/50 group-hover:border-primary group-hover:bg-primary/5'
                                    )}>
                                        {item.step}
                                        {idx === 0 && <div className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-background animate-ping" />}
                                    </div>
                                    <div className="p-8 lg:p-12 rounded-[3.5rem] border-2 bg-card/40 backdrop-blur-md border-border/50 flex-grow hover:border-primary/30 hover:shadow-2xl hover:bg-background/80 transition-all duration-500 group/card relative overflow-hidden">
                                        <div className="absolute -right-4 -bottom-4 h-24 w-24 text-primary opacity-[0.03] group-hover/card:scale-150 transition-transform duration-700">
                                            <Zap className="h-full w-full fill-primary" />
                                        </div>
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-4">
                                                <h3 className="text-2xl font-black italic">{item.title}</h3>
                                                <Badge variant="outline" className="text-[10px] font-black opacity-30 uppercase tracking-widest hidden sm:flex">Phase 0{idx + 1}</Badge>
                                            </div>
                                            <p className="text-sm lg:text-base font-bold text-muted-foreground italic leading-relaxed pl-6 border-l-4 border-primary/20 group-hover/card:border-primary transition-colors">
                                                "{item.desc}"
                                            </p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Meta Sidebar Analytics */}
                    <div className="xl:col-span-4 space-y-8">
                        <SpotlightCard className="rounded-[3.5rem] border-none bg-[#020617] text-white p-10 lg:p-12 shadow-[0_50px_100px_rgba(0,0,0,0.4)] overflow-hidden relative group">
                            <div className="absolute top-0 right-0 p-8 opacity-5 -rotate-12 translate-x-12 -translate-y-12">
                                <Bot className="h-64 w-64" />
                            </div>

                            <div className="relative z-10 space-y-10">
                                <div>
                                    <Badge className="bg-white/10 text-accent-1 mb-6 px-4 py-1.5 font-black uppercase tracking-widest text-[9px] rounded-full border border-white/10 italic">Expert Tutor</Badge>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter leading-none italic mb-4">Master Insight</h3>
                                    <p className="text-sm font-bold leading-relaxed text-blue-100/60 uppercase tracking-wider italic">
                                        "I am {data.tutor}. My system has processed <span className="text-white">12,000+ top-tier examinations</span>. Together, we will master the {courseId.toUpperCase()} exam patterns."
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    {[
                                        { label: 'Adaptive Learning', val: 'Active', color: 'text-green-400' },
                                        { label: 'Vocabulary Scoring', val: 'V2.4', color: 'text-accent-1' },
                                        { label: 'Pronunciation Feedback', val: 'Enabled', color: 'text-primary' },
                                        { label: 'Template Mastery', val: 'Calibrated', color: 'text-accent-3' }
                                    ].map((f, i) => (
                                        <div key={i} className="flex justify-between items-center p-5 rounded-[1.5rem] bg-white/5 border border-white/10 group/item hover:bg-white/10 transition-colors">
                                            <span className="text-[9px] font-black uppercase tracking-widest opacity-40">{f.label}</span>
                                            <span className={cn("text-[10px] font-black italic", f.color)}>{f.val}</span>
                                        </div>
                                    ))}
                                </div>

                                <Button className="w-full h-16 rounded-2xl bg-white text-black hover:scale-105 active:scale-95 transition-all text-[11px] font-black tracking-[0.3em] shadow-xl">
                                    UPGRADE TO PRO PLAN
                                </Button>
                            </div>
                        </SpotlightCard>

                        <div className="p-1.5 rounded-[3.5rem] bg-gradient-to-br from-primary via-accent-3 to-accent-1 shadow-2xl">
                            <Card className="rounded-[3.4rem] border-none bg-background p-10 text-center">
                                <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                                    <MessageSquare className="h-6 w-6 text-primary" />
                                </div>
                                <h4 className="text-xl font-black italic mb-3">Student Success</h4>
                                <p className="text-xs font-bold italic text-muted-foreground leading-relaxed mb-6">
                                    "The AI spotted my filler words and phonetic gaps in real-time. My speaking jump-start was unprecedented."
                                </p>
                                <div className="flex flex-col items-center">
                                    <div className="font-black text-[10px] uppercase tracking-widest text-primary mb-1">— David K.</div>
                                    <div className="text-[8px] font-black uppercase tracking-widest text-muted-foreground opacity-40">IELTS Candidate (Band 8.5)</div>
                                </div>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
