'use client';

import React, { useState, useEffect } from 'react';
import {
    BookOpen,
    ArrowLeft,
    ChevronRight,
    RotateCcw,
    CheckCircle2,
    Clock,
    Sparkles,
    Zap,
    Layout,
    Columns,
    ListOrdered
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { pteReadingData } from '@/lib/pte-data';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';

export default function ReadingTaskPage() {
    const params = useParams();
    const router = useRouter();

    const section = 'reading';
    const task = params.task as string;
    const id = parseInt(params.id as string);

    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes for reading tasks

    const questionData = (pteReadingData as any)[task]?.[id - 1];

    useEffect(() => {
        if (!questionData) {
            router.push(`/dashboard/ai-score-test/${section}`);
        }
    }, [questionData, router, section]);

    useEffect(() => {
        if (timeLeft > 0 && !isSubmitted) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, isSubmitted]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSubmit = () => {
        setIsSubmitted(true);
    };

    if (!questionData) return null;

    const isCorrect = selectedOption === questionData.answer;

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="group hover:bg-primary/5">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Sections
                </Button>
                <div className="flex items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full border border-border/50 bg-card flex items-center gap-2 font-black text-xs ${timeLeft < 30 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                        <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
                    </div>
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-accent-3/20 bg-accent-3/5 text-accent-3 text-[10px] font-black uppercase tracking-widest">
                        {task.replace('-', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="rounded-[3rem] border-2 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[500px] flex flex-col">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                            <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" /> Comprehensive Passage
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 space-y-8">
                            <div className="bg-muted/30 p-8 rounded-[2rem] border border-border/50 leading-relaxed text-lg text-foreground/90 font-medium">
                                {questionData.passage || "Reading passage content goes here..."}
                            </div>

                            {task === 'multiple-choice' && (
                                <div className="space-y-6">
                                    <h3 className="text-xl font-black">{questionData.question}</h3>
                                    <RadioGroup value={selectedOption || ''} onValueChange={setSelectedOption} disabled={isSubmitted} className="space-y-3">
                                        {questionData.options?.map((opt: string, i: number) => (
                                            <div key={i} className={`flex items-center space-x-3 p-4 rounded-2xl border-2 transition-all ${selectedOption === opt
                                                    ? 'border-primary bg-primary/5 shadow-md'
                                                    : 'border-border/50 hover:border-primary/30'
                                                }`}>
                                                <RadioGroupItem value={opt} id={`opt-${i}`} className="text-primary border-primary" />
                                                <Label htmlFor={`opt-${i}`} className="flex-grow cursor-pointer font-bold text-sm">{opt}</Label>
                                            </div>
                                        ))}
                                    </RadioGroup>
                                </div>
                            )}

                            {task === 'reorder-paragraphs' && (
                                <div className="p-8 border-2 border-dashed border-primary/20 rounded-[2.5rem] bg-primary/5 text-center">
                                    <Layout className="h-12 w-12 text-primary/30 mx-auto mb-4" />
                                    <h3 className="text-xl font-black mb-2 italic text-primary">Reorder Logic Matrix Active</h3>
                                    <p className="text-muted-foreground font-medium text-sm">Drag-and-drop sequencing is currently in simulation mode for this session.</p>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter className="p-8 border-t bg-muted/20 flex justify-end">
                            {!isSubmitted ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!selectedOption && task === 'multiple-choice'}
                                    className="h-14 px-10 rounded-2xl font-black tracking-widest bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    <Zap className="h-5 w-5 mr-2" /> SUBMIT ANALYSIS
                                </Button>
                            ) : (
                                <Button onClick={() => router.back()} variant="outline" className="h-14 px-10 rounded-2xl font-black tracking-widest border-2">
                                    NEXT SESSION <ChevronRight className="ml-2 h-4 w-4" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* Sidebar Analytics */}
                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence mode="wait">
                        {isSubmitted ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                            >
                                <SpotlightCard className="rounded-[2.5rem] border-none bg-[#020617] text-white p-8 shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-10">
                                        <Sparkles className="h-24 w-24" />
                                    </div>
                                    <h3 className="text-xl font-black mb-10 uppercase tracking-widest text-accent-3">SESSION REPORT</h3>

                                    <div className="space-y-8">
                                        <div className="flex items-center gap-6">
                                            <div className={`h-16 w-16 rounded-2xl flex items-center justify-center text-3xl font-black ${isCorrect ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                                                {isCorrect ? '90' : '10'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-black uppercase tracking-widest opacity-60">Status</div>
                                                <div className={`text-xl font-black uppercase ${isCorrect ? 'text-green-500' : 'text-red-500'}`}>
                                                    {isCorrect ? 'PASSED' : 'FAILED'}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs font-bold leading-relaxed italic opacity-80">
                                            {isCorrect
                                                ? "Correct synthesis identified. Your neural reading pathways correctly mapped the primary argument."
                                                : `Incorrect option selected. The correct answer was "${questionData.answer}". Re-analyze the passage cues.`}
                                        </div>

                                        <Button onClick={() => { setIsSubmitted(false); setSelectedOption(null); setTimeLeft(120); }} className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-widest">
                                            RESTART SIMULATION
                                        </Button>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ) : (
                            <Card className="rounded-[2.5rem] border-2 bg-primary/5 p-8 border-primary/10">
                                <CardHeader className="p-0 mb-6">
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Zap className="h-6 w-6 text-primary" /> Exam Target
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-6">
                                    <div className="p-4 rounded-2xl bg-background border border-border/50">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 text-center">Optimal Pace</div>
                                        <div className="text-3xl font-black text-center text-primary">120s</div>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            'Identify Topic Sentences',
                                            'Scan for Key Indicators',
                                            'Re-read for Logic Flow'
                                        ].map(tip => (
                                            <div key={tip} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {tip}
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}
