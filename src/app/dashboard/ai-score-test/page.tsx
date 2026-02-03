'use client';

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from '@/components/ui/card';
import {
    ArrowLeft,
    Sparkles,
    Mic,
    PenTool,
    BookOpen,
    Headphones,
    ChevronRight,
    Target,
    Clock,
    Award,
    Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const pteSections = [
    {
        title: 'Speaking',
        id: 'speaking',
        icon: Mic,
        description: 'Read Aloud, Repeat Sentence, Describe Image, and more.',
        color: 'text-accent-1',
        bg: 'bg-accent-1/10',
        border: 'hover:border-accent-1/50',
        gradient: 'from-accent-1/20 to-transparent',
        tasks: 7,
        duration: '30-35 mins'
    },
    {
        title: 'Writing',
        id: 'writing',
        icon: PenTool,
        description: 'Summarize Written Text and Write Essay.',
        color: 'text-accent-2',
        bg: 'bg-accent-2/10',
        border: 'hover:border-accent-2/50',
        gradient: 'from-accent-2/20 to-transparent',
        tasks: 2,
        duration: '40-50 mins'
    },
    {
        title: 'Reading',
        id: 'reading',
        icon: BookOpen,
        description: 'Fill in the blanks, Multiple choice, and Reorder paragraphs.',
        color: 'text-accent-3',
        bg: 'bg-accent-3/10',
        border: 'hover:border-accent-3/50',
        gradient: 'from-accent-3/20 to-transparent',
        tasks: 5,
        duration: '32-41 mins'
    },
    {
        title: 'Listening',
        id: 'listening',
        icon: Headphones,
        description: 'Summarize Spoken Text, Fill in the blanks, and Dictation.',
        color: 'text-accent-4',
        bg: 'bg-accent-4/10',
        border: 'hover:border-accent-4/50',
        gradient: 'from-accent-4/20 to-transparent',
        tasks: 8,
        duration: '45-57 mins'
    }
];

export default function AIScoreTestPage() {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <Button asChild variant="ghost" className="mb-4 hover:bg-primary/5 group">
                        <Link href="/dashboard" className="flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
                            <Target className="h-8 w-8 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black font-display tracking-tight">AI Score Master</h1>
                            <p className="text-muted-foreground font-medium">Precision PTE Practice with Intelligent Analysis</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4 bg-card/50 backdrop-blur-sm p-4 rounded-[2rem] border shadow-sm">
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center overflow-hidden">
                                <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent-3/20" />
                            </div>
                        ))}
                    </div>
                    <div className="text-xs">
                        <div className="font-black">1.2k+ Students</div>
                        <div className="text-muted-foreground font-bold">Practicing right now</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Main Selection Grid */}
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {pteSections.map((section, idx) => (
                        <Link key={section.id} href={`/dashboard/ai-score-test/${section.id}`}>
                            <SpotlightCard className={`h-full rounded-[2.5rem] border-2 bg-card/40 backdrop-blur-md p-8 flex flex-col transition-all duration-500 ${section.border} hover:-translate-y-2 hover:shadow-2xl group`}>
                                <div className={`relative z-10 w-16 h-16 rounded-2xl ${section.bg} flex items-center justify-center mb-6 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg`}>
                                    <section.icon className={`h-8 w-8 ${section.color}`} />
                                </div>

                                <div className="relative z-10 flex-grow">
                                    <h3 className="text-2xl font-black mb-3 group-hover:text-primary transition-colors leading-tight">{section.title}</h3>
                                    <p className="text-sm text-muted-foreground font-medium leading-relaxed opacity-80">{section.description}</p>
                                </div>

                                <div className="relative z-10 mt-8 space-y-4">
                                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                        <span className="flex items-center gap-1"><Zap className="h-3 w-3 text-primary" /> {section.tasks} Task Types</span>
                                        <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-primary" /> {section.duration}</span>
                                    </div>
                                    <div className="flex items-center text-xs font-black uppercase tracking-widest text-primary group-hover:gap-2 transition-all">
                                        Enter Section <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </div>
                                </div>
                            </SpotlightCard>
                        </Link>
                    ))}
                </div>

                {/* Info Cards */}
                <Card className="rounded-[2.5rem] border-none shadow-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white overflow-hidden relative group">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                        <Award className="h-32 w-32" />
                    </div>
                    <CardHeader className="relative z-10">
                        <CardTitle className="text-3xl font-black">PTE Score Accuracy</CardTitle>
                        <CardDescription className="text-blue-100 font-medium opacity-90">Our AI uses the same scoring parameters as the actual Pearson Test of English.</CardDescription>
                    </CardHeader>
                    <CardContent className="relative z-10 flex items-end justify-between">
                        <div>
                            <ul className="space-y-3 mb-6">
                                {['99.2% Score Correlation', 'Real-time Phonetic Analysis', 'Grammar & Syntax Matrix'].map(item => (
                                    <li key={item} className="flex items-center gap-2 text-sm font-bold">
                                        <Sparkles className="h-4 w-4 text-accent-4" /> {item}
                                    </li>
                                ))}
                            </ul>
                            <Button className="bg-white text-primary hover:bg-white/90 rounded-2xl font-bold px-8 h-12">
                                View Matrix Specs
                            </Button>
                        </div>
                        <div className="text-right">
                            <div className="text-5xl font-black">9.0</div>
                            <div className="text-[10px] font-black uppercase tracking-tighter opacity-60">Global Band Equivalent</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="rounded-[2.5rem] border bg-accent-2/5 border-accent-2/20 relative overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-2xl font-black flex items-center gap-2">
                            <Clock className="h-6 w-6 text-accent-2" /> Daily Practice Goal
                        </CardTitle>
                        <CardDescription>Consistency is the key to a 79+ score.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-6 mb-8">
                            <div className="h-24 w-24 rounded-full border-8 border-accent-2/20 flex items-center justify-center relative">
                                <div className="text-2xl font-black">3/5</div>
                                <svg className="absolute inset-0 h-full w-full -rotate-90">
                                    <circle
                                        cx="48" cy="48" r="40"
                                        fill="none" stroke="currentColor"
                                        strokeWidth="8"
                                        strokeDasharray="251.2"
                                        strokeDashoffset="100"
                                        className="text-accent-2"
                                    />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-black text-lg">Goal Progress</h4>
                                <p className="text-sm text-muted-foreground font-medium italic">"You are just 2 speaking tests away from completing today's mission!"</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, i) => (
                                <div key={i} className={`h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${i < 3 ? 'bg-accent-2 text-white' : 'bg-muted text-muted-foreground'}`}>
                                    {day}
                                </div>
                            ))}
                            <div className="h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                <Award className="h-4 w-4 text-primary" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
