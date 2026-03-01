'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import {
    BookOpen,
    Calendar,
    Clock,
    CheckCircle2,
    ArrowRight,
    Check,
    Target,
    Users,
    Sparkles,
    ShieldCheck,
    Monitor,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { LMS_URL } from '@/lib/constants';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const features = [
    "How to create advanced sentence structures",
    "How to write complex and compound sentences",
    "Understanding academic writing",
    "Most essential academic vocabulary",
    "How to compare and contrast ideas",
    "How to maintain coherence and cohesion",
    "How to use advanced tenses correctly",
    "How to write in passive voice",
    "Linking sentences logically to improve writing flow",
    "Strategies for IELTS / PTE Writing & Speaking scores"
];

const targetAudience = [
    "Students preparing for IELTS, PTE, CELPIP",
    "Anyone planning professional English exams",
    "Students struggling with sentence structure",
    "Learners wanting to improve academic writing",
    "Professionals seeking career growth"
];

export default function GrammarClinicPage() {
    return (
        <div className="w-full relative overflow-hidden bg-background">
            {/* Decorative Background */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-grid-slate-200/[0.05]" />
            <div className="absolute top-[10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[120px]" />
            <div className="absolute bottom-[20%] right-[-5%] w-[30%] h-[30%] bg-orange-500/5 rounded-full blur-[100px]" />

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 md:pt-32 md:pb-48 overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-8"
                        >
                            <div className="flex flex-wrap gap-2">
                                <Badge className="bg-blue-600 text-white border-none uppercase tracking-widest text-[10px] font-black">Exam Focused</Badge>
                                <Badge className="bg-orange-500 text-white border-none uppercase tracking-widest text-[10px] font-black">Weekend Batch</Badge>
                                <Badge className="bg-green-600 text-white border-none uppercase tracking-widest text-[10px] font-black">Limited Seats</Badge>
                            </div>

                            <div>
                                <h1 className="text-5xl md:text-7xl font-black font-headline leading-[0.9] tracking-tighter mb-6">
                                    Grammar <br />
                                    <span className="text-[#1E40AF]">Clinic</span>
                                </h1>
                                <p className="text-2xl md:text-3xl font-black text-muted-foreground italic leading-tight mb-8">
                                    Foundation for IELTS, PTE & <br />
                                    Professional English Exams
                                </p>
                                <p className="text-xl text-muted-foreground max-w-xl font-medium">
                                    Upgrade your grammar. Upgrade your score. Construct advanced academic sentences with absolute confidence.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
                                <div className="space-y-2">
                                    <div className="p-2 w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                        <Zap className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Investment</p>
                                        <p className="text-lg font-black tracking-tight">LKR 5,000</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="p-2 w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center">
                                        <Calendar className="h-5 w-5 text-orange-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Days</p>
                                        <p className="text-lg font-black tracking-tight">Sat & Sun</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="p-2 w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
                                        <Clock className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Time</p>
                                        <p className="text-lg font-black tracking-tight">4PM-6PM</p>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="p-2 w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                                        <Monitor className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-muted-foreground uppercase opacity-60">Mode</p>
                                        <p className="text-lg font-black tracking-tight">Online</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-4">
                                <Button asChild size="xl" className="rounded-2xl bg-[#1E40AF] hover:bg-blue-700 text-white font-black px-12 h-16 text-lg group shadow-2xl transition-all duration-300">
                                    <Link href={LMS_URL}>
                                        Enroll in Clinic
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                                <div className="flex flex-col justify-center">
                                    <Button variant="ghost" asChild className="h-12 text-sm font-black uppercase text-orange-500 hover:text-orange-600 hover:bg-orange-500/5 group">
                                        <Link href="/pte">
                                            Click here for PTE Boostify
                                            <Zap className="ml-2 h-4 w-4 fill-orange-500 transition-transform group-hover:scale-110" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, rotate: 5 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            transition={{ duration: 0.8, delay: 0.2 }}
                            className="relative aspect-square max-w-md mx-auto"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-orange-500/20 to-transparent blur-3xl animate-pulse" />
                            <div className="relative glass-card overflow-hidden rounded-[40px] border-none shadow-[0_20px_50px_rgba(30,64,175,0.3)] group">
                                <Image
                                    src="/images/monsters/monster-yellow-grammar.jpg"
                                    alt="Grammar Monster"
                                    fill
                                    className="object-cover transform group-hover:scale-110 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#1E40AF]/80 via-transparent to-transparent opacity-60 md:opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="absolute bottom-10 left-10 right-10">
                                    <p className="text-white font-black text-2xl font-headline tracking-tighter drop-shadow-lg">Defeat the <span className="text-orange-400 italic">Grammar Monster!</span></p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Intro Section - Copy */}
            <section className="py-20 bg-muted/5">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-4xl mx-auto glass-card p-10 md:p-16 rounded-[40px] border-none shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
                        <div className="space-y-6">
                            <h2 className="text-3xl font-black font-headline tracking-tight text-[#1E40AF]">Grammar Clinic – LKR 5,000</h2>
                            <p className="text-lg md:text-xl font-medium leading-relaxed italic text-muted-foreground">
                                "Build the most important foundation required for IELTS, PTE, CELPIP, and all professional English exams. This weekend program focuses on upgrading your grammar skills and helping you construct advanced academic sentences with confidence."
                            </p>
                            <p className="text-base text-muted-foreground leading-relaxed">
                                Through this course, you will learn advanced sentence structures, coherence and cohesion techniques, academic vocabulary, passive voice, complex sentences, and advanced tense usage. This is the best starting point for anyone planning to take an international English exam.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Marketing Angle - Who is this for? */}
            <section className="py-24 relative overflow-hidden">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/10 border border-blue-600/20 text-[#1E40AF] text-xs font-black uppercase tracking-widest">
                                Marketing Angle
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black font-headline leading-tight tracking-tighter">Who is this Clinic <br /><span className="text-orange-500">ideal for?</span></h2>
                            <div className="grid gap-4">
                                {targetAudience.map((target, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0, y: 10 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: i * 0.1 }}
                                        className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors group"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                            <Users className="h-5 w-5" />
                                        </div>
                                        <span className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">{target}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-blue-600/10 blur-[120px] rounded-full" />
                            <div className="p-8 md:p-12 glass-card rounded-[40px] border-none shadow-2xl space-y-8 relative">
                                <h3 className="text-2xl font-black font-headline text-[#1E40AF] underline decoration-orange-500 decoration-4 underline-offset-8">Core Skill Upgradation</h3>
                                <div className="grid gap-4">
                                    {features.map((feature, i) => (
                                        <div key={i} className="flex items-start gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                            <span className="text-sm font-semibold text-muted-foreground">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-6">
                                    <Button asChild className="w-full bg-orange-600 hover:bg-orange-700 text-white font-black h-14 rounded-2xl text-lg group">
                                        <Link href={`https://wa.me/94766914650?text=I'd like to register for the Grammar Clinic course`}>
                                            Register via WhatsApp
                                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                        </Link>
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SEO Section - What is Academic Writing? */}
            <section className="py-24 bg-[#1E40AF] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px] -mr-20 -mt-20" />
                <div className="container mx-auto px-4 lg:px-8 relative">
                    <div className="max-w-4xl mx-auto space-y-8">
                        <div className="space-y-4 text-center">
                            <Badge className="bg-white/10 border-white/20 text-white/80 py-1 px-4 text-[10px] tracking-widest uppercase font-black">Knowledge Base</Badge>
                            <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter">What is <span className="italic text-orange-400">Academic Writing?</span></h2>
                        </div>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12">
                            {[
                                { title: "Formal Structure", text: "Avoiding informal language and slangs, maintaining a professional academic tone." },
                                { title: "Clear Logic", text: "Presenting ideas with precision and structured internal coherence." },
                                { title: "Advanced Grammar", text: "Using complex tenses, passive voice, and diverse sentence structures." },
                                { title: "Academic Vocabulary", text: "Using precise terminology (lexical resources) instead of common words." },
                                { title: "Flow & Accuracy", text: "Ensuring clarity, transparency, and syntactic accuracy across all paragraphs." }
                            ].map((item, i) => (
                                <div key={i} className="p-6 rounded-3xl bg-white/10 border border-white/10 backdrop-blur-md space-y-3">
                                    <h4 className="text-lg font-black font-headline text-orange-400 italic">{item.title}</h4>
                                    <p className="text-sm text-white/70 font-medium leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                            <div className="md:col-span-2 lg:col-span-1 p-6 flex items-center justify-center italic text-white/40 text-sm font-black uppercase text-center border-2 border-dashed border-white/20 rounded-3xl">
                                Crucial for high scores in <br /> IELTS & PTE Writing
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Details Table Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="max-w-3xl mx-auto space-y-12">
                        <div className="text-center space-y-4">
                            <h2 className="text-4xl font-black font-headline tracking-tight uppercase">Clinic <span className="text-[#1E40AF]">Specifications</span></h2>
                            <p className="text-muted-foreground font-medium italic">Everything you need to know about the program structure.</p>
                        </div>

                        <div className="rounded-3xl overflow-hidden border border-muted shadow-2xl">
                            <Table>
                                <TableHeader className="bg-muted/50">
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="w-[200px] font-black uppercase text-xs tracking-widest">Feature</TableHead>
                                        <TableHead className="font-black uppercase text-xs tracking-widest">Details</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[
                                        ["Course Name", "Grammar Clinic"],
                                        ["Duration", "Weekend (2 Days)"],
                                        ["Schedule", "Saturday & Sunday"],
                                        ["Time", "4.00 PM – 6.00 PM Sri Lankan Time"],
                                        ["Investment", "LKR 5,000"],
                                        ["Target Level", "Beginner to Intermediate"],
                                        ["Core Focus", "Grammar Foundation for IELTS / PTE / CELPIP"]
                                    ].map((row, i) => (
                                        <TableRow key={i} className="hover:bg-blue-600/5 transition-colors border-muted">
                                            <TableCell className="font-black text-muted-foreground uppercase text-[11px] font-headline">{row[0]}</TableCell>
                                            <TableCell className="font-bold text-foreground">{row[1]}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="flex justify-center">
                            <Button asChild size="xl" className="rounded-full bg-blue-600 hover:bg-blue-700 text-white font-black px-12 h-16 text-xl group shadow-2xl">
                                <Link href={`https://wa.me/94766914650?text=I'd like to register for the Grammar Clinic`}>
                                    Secure Your Slot
                                    <ArrowRight className="ml-2 h-6 w-6 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Conversion Trigger Section */}
            <section className="py-24 bg-gradient-to-br from-background to-blue-50">
                <div className="container mx-auto px-4 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black font-headline tracking-tighter leading-tight">Why this Clinic <br /><span className="text-[#1E40AF]">is important</span></h2>
                            <div className="space-y-6">
                                <p className="text-lg font-medium text-muted-foreground leading-relaxed italic">
                                    "Without a strong grammar foundation, your academic dreams remain out of reach."
                                </p>
                                <div className="space-y-4">
                                    {[
                                        { title: "Low Writing Scores", text: "Poor sentence structure and limited range keeps your band score stuck below 6.5." },
                                        { title: "Lack of Accuracy", text: "Grammatical errors in speaking distract markers and lower your overall fluency score." },
                                        { title: "Vague Presentation", text: "Weak foundations lead to ideas being lost in poor translation and phrasing." }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4 p-6 rounded-3xl bg-white shadow-xl border border-red-500/10">
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center shrink-0">
                                                <ShieldCheck className="h-5 w-5 text-red-500" />
                                            </div>
                                            <div className="space-y-1">
                                                <h4 className="font-black text-red-600 uppercase text-xs tracking-widest">{item.title}</h4>
                                                <p className="text-sm font-medium text-muted-foreground">{item.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/20 blur-[150px] rounded-full -z-10" />
                            <div className="p-8 md:p-16 glass-card rounded-[50px] border-none shadow-2xl text-center space-y-8">
                                <div className="w-20 h-20 rounded-3xl bg-[#1E40AF]/10 flex items-center justify-center mx-auto mb-6">
                                    <Target className="h-10 w-10 text-[#1E40AF]" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-2xl md:text-3xl font-black font-headline tracking-tight uppercase">Achieve <span className="text-[#1E40AF]">Band 7+ / 79+</span> Mastery</h3>
                                    <p className="text-muted-foreground font-medium italic">Build the unbreakable foundation required to achieve elite scores.</p>
                                </div>

                                <div className="space-y-4 pt-8 border-t border-muted">
                                    <p className="text-sm font-black text-muted-foreground uppercase opacity-60">Ready for elite prep?</p>
                                    <Button asChild variant="hero" size="xl" className="w-full rounded-2xl bg-[#1E40AF] group">
                                        <Link href="/pte">
                                            Join PTE Boostify Program  →
                                        </Link>
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase">Looking for full PTE preparation?</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer Support */}
            <footer className="py-12 border-t border-muted bg-muted/20">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground font-medium">
                        &copy; 2026 Smart Labs International. All Rights Reserved. <br />
                        Part of the Premium Academic Success Series.
                    </p>
                </div>
            </footer>
        </div>
    );
}
