'use client';

import React, { useState } from 'react';
import {
    BookOpen,
    ArrowLeft,
    ChevronRight,
    ListOrdered,
    Columns,
    History,
    Zap,
    CheckCircle2,
    Clock,
    Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';

const readingTasks = [
    {
        id: 'multiple-choice',
        title: 'Multiple Choice',
        description: 'Read a passage and answer one or more questions by selecting the correct options.',
        icon: ListOrdered,
        difficulty: 'Medium',
        time: '20-30s per Q',
        count: 5,
        color: 'text-accent-3',
        bg: 'bg-accent-3/10'
    },
    {
        id: 'reorder-paragraphs',
        title: 'Reorder Paragraphs',
        description: 'Restore the original order of text boxes by dragging them into the correct sequence.',
        icon: Columns,
        difficulty: 'Hard',
        time: '2 mins',
        count: 5,
        color: 'text-orange-500',
        bg: 'bg-orange-500/10'
    }
];

export default function ReadingSectionPage() {
    const [selectedTask, setSelectedTask] = useState<string | null>(null);

    return (
        <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                    <Button asChild variant="ghost" className="mb-4 hover:bg-primary/5 group">
                        <Link href="/dashboard/ai-score-test" className="flex items-center">
                            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                            Back to Sections
                        </Link>
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-[2rem] bg-accent-3/10 flex items-center justify-center border border-accent-3/20 shadow-inner">
                            <BookOpen className="h-7 w-7 text-accent-3" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black font-display tracking-tight">Reading Matrix</h1>
                            <p className="text-muted-foreground font-medium flex items-center gap-2">
                                <History className="h-4 w-4" /> 5 Premium Questions per Task Type
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <div className="glass-card px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-xs font-black uppercase opacity-60">Avg Score</span>
                        <span className="text-xl font-black text-accent-3">82</span>
                    </div>
                    <div className="glass-card px-6 py-3 rounded-2xl flex flex-col items-center">
                        <span className="text-xs font-black uppercase opacity-60">Tests Done</span>
                        <span className="text-xl font-black text-primary">5</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Task Picker */}
                <div className="lg:col-span-1 space-y-4">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground ml-2 mb-4">Select Reading Architecture</h2>
                    {readingTasks.map((task) => (
                        <motion.div
                            key={task.id}
                            whileHover={{ x: 5 }}
                            onClick={() => setSelectedTask(task.id)}
                            className={`cursor-pointer p-6 rounded-[2rem] border-2 transition-all duration-300 relative overflow-hidden group ${selectedTask === task.id
                                ? 'bg-primary border-primary shadow-xl shadow-primary/20'
                                : 'bg-card/50 border-border/50 hover:border-primary/50'
                                }`}
                        >
                            <div className="relative z-10 flex flex-col gap-4">
                                <div className="flex justify-between items-start">
                                    <div className={`p-4 rounded-2xl ${selectedTask === task.id ? 'bg-white/20' : task.bg} transition-colors`}>
                                        <task.icon className={`h-6 w-6 ${selectedTask === task.id ? 'text-white' : task.color}`} />
                                    </div>
                                    <Badge variant="outline" className={`rounded-xl px-3 ${selectedTask === task.id ? 'border-white/40 text-white' : 'border-primary/20 text-primary'}`}>
                                        {task.count} Sets Available
                                    </Badge>
                                </div>
                                <div>
                                    <h3 className={`text-xl font-black mb-1 ${selectedTask === task.id ? 'text-white' : 'text-foreground'}`}>{task.title}</h3>
                                    <p className={`text-xs font-medium leading-relaxed ${selectedTask === task.id ? 'text-white/80' : 'text-muted-foreground'}`}>{task.description}</p>
                                </div>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest pt-2 border-t border-white/10">
                                    <span className={selectedTask === task.id ? 'text-white/60' : 'text-muted-foreground'}>Difficulty: {task.difficulty}</span>
                                    <span className={selectedTask === task.id ? 'text-white/60' : 'text-muted-foreground'}>{task.time}</span>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Right Column: Question Selection & Preview */}
                <div className="lg:col-span-2">
                    <AnimatePresence mode="wait">
                        {selectedTask ? (
                            <motion.div
                                key={selectedTask}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="space-y-6"
                            >
                                <div className="flex items-center justify-between px-2">
                                    <h2 className="text-xl font-black font-display tracking-tight flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-primary" /> Questions for {readingTasks.find(t => t.id === selectedTask)?.title}
                                    </h2>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {[1, 2, 3, 4, 5].map((qNum) => (
                                        <Link
                                            key={qNum}
                                            href={`/dashboard/ai-score-test/reading/${selectedTask}/${qNum}`}
                                            className="block"
                                        >
                                            <SpotlightCard className="p-6 rounded-[2rem] border-2 bg-card/40 backdrop-blur-md hover:border-primary/50 transition-all group flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-primary text-xl border border-primary/20 group-hover:scale-110 transition-transform">
                                                        0{qNum}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black text-lg group-hover:text-primary transition-colors">Exam Passage Set #{qNum}</h4>
                                                        <div className="flex items-center gap-4 mt-1">
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                                                <Clock className="h-3 w-3" /> Complex Vocabulary
                                                            </span>
                                                            <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1 text-accent-1">
                                                                <Sparkles className="h-3 w-3" /> Real Exam Level
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <Button size="icon" variant="ghost" className="rounded-xl group-hover:bg-primary group-hover:text-white transition-all">
                                                        <ChevronRight className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </SpotlightCard>
                                        </Link>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="h-full min-h-[500px] border-2 border-dashed border-border/50 rounded-[3rem] flex flex-col items-center justify-center p-12 text-center bg-muted/20">
                                <div className="h-24 w-24 rounded-[3rem] bg-background shadow-inner flex items-center justify-center mb-8 border border-border/50">
                                    <BookOpen className="h-10 w-10 text-muted-foreground/50 animate-pulse" />
                                </div>
                                <h3 className="text-2xl font-black mb-2">Ready to Read?</h3>
                                <p className="text-muted-foreground font-medium max-w-sm">Select a task on the left to initialize the AI reading comprehension matrix and begin your session.</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
