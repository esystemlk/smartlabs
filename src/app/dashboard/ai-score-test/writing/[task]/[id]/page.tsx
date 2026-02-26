'use client';

import React, { useState, useEffect } from 'react';
import {
    PenTool,
    Loader2,
    Sparkles,
    ArrowLeft,
    Clock,
    Award,
    BookOpen,
    Brain,
    History,
    TrendingUp,
    FileEdit
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { scorePteWriteEssay } from '@/ai/flows/score-pte-writing-write-essay';
import { scorePteSummarizeWrittenText } from '@/ai/flows/score-pte-writing-summarize-text';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { pteWritingData } from '@/lib/pte-data';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export default function WritingTaskPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const section = 'writing';
    const task = params.task as string;
    const paramId = params.id as string;
    const isGenerated = paramId === 'generated-ai';
    const id = isGenerated ? 0 : parseInt(paramId);

    const [textInput, setTextInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isGenerating, setIsGenerating] = useState(isGenerated);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [generatedData, setGeneratedData] = useState<any>(null);

    // Load data (Static or AI Generated)
    useEffect(() => {
        const loadQuestion = async () => {
            if (isGenerated) {
                try {
                    // Start generation
                    setIsGenerating(true);
                    const { generateExamQuestion } = await import('@/ai/flows/generate-question');
                    const question = await generateExamQuestion({
                        examType: 'PTE', // Default to PTE for now, could be dynamic
                        taskType: task === 'write-essay' ? 'Write Essay' : 'Summarize Text'
                    });

                    setGeneratedData({
                        prompt: question.content, // Map 'content' to 'prompt'/text
                        text: question.content,
                        title: question.title,
                        time: question.timeLimit
                    });
                    setTimeLeft(question.timeLimit * 60);
                    setIsGenerating(false);
                } catch (error) {
                    toast({ variant: 'destructive', title: 'Generation Failed', description: 'Could not generate question.' });
                    router.push(`/dashboard/ai-score-test/${section}`);
                }
            } else {
                const staticData = (pteWritingData as any)[task]?.[id - 1];
                if (!staticData) {
                    router.push(`/dashboard/ai-score-test/${section}`);
                } else {
                    setTimeLeft(task === 'write-essay' ? 20 * 60 : 10 * 60);
                }
            }
        };

        loadQuestion();
    }, [isGenerated, task, id, router, section, toast]);

    // Derived question data
    const questionData = isGenerated ? generatedData : (pteWritingData as any)[task]?.[id - 1];

    useEffect(() => {
        if (timeLeft > 0 && !result && !isGenerating) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, result, isGenerating]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const handleSubmit = async () => {
        if (!textInput.trim() || !questionData) return;

        const wordCount = textInput.split(/\s+/).filter(Boolean).length;
        if (task === 'write-essay' && (wordCount < 100)) {
            toast({ variant: 'destructive', title: 'Essay Too Short', description: 'Please write at least 100 words.' });
            return;
        }

        setIsLoading(true);
        try {
            let scoreResult;
            if (task === 'write-essay') {
                scoreResult = await scorePteWriteEssay({ topic: questionData.prompt || questionData.title, essay: textInput });
            } else {
                scoreResult = await scorePteSummarizeWrittenText({ passage: questionData.text, summary: textInput });
            }
            setResult(scoreResult);
            setIsLoading(false);
            toast({ title: "Submission Evaluated", description: "AI Matrix analysis complete." });
        } catch (error) {
            setIsLoading(false);
            toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not sync with AI Matrix.' });
        }
    };

    if (isGenerating) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full" />
                    <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                </div>
                <div>
                    <h2 className="text-2xl font-black font-display tracking-tight mb-2">Generating Neural Exam Question...</h2>
                    <p className="text-muted-foreground font-medium animate-pulse">Analyzing 2,400+ recent exam topics from 2024-2025...</p>
                </div>
            </div>
        );
    }

    if (!questionData) return null;

    const wordCount = textInput.split(/\s+/).filter(Boolean).length;

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="group hover:bg-primary/5">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Matrix
                </Button>
                <div className="flex items-center gap-4">
                    {isGenerated && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-none font-black animate-pulse shadow-lg shadow-purple-500/20">
                            <Sparkles className="h-3 w-3 mr-1" /> AI GENERATED
                        </Badge>
                    )}
                    <div className={`px-4 py-1.5 rounded-full border border-border/50 bg-card flex items-center gap-2 font-black text-xs ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                        <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
                    </div>
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-accent-2/20 bg-accent-2/5 text-accent-2 text-[10px] font-black uppercase tracking-widest">
                        {task.replace('-', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Writing Interface */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="rounded-[3rem] border-2 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden min-h-[600px] flex flex-col">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 p-8">
                            <div className="flex justify-between items-center mb-4">
                                <CardTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                    <FileEdit className="h-5 w-5 text-primary" /> Matrix Input Term
                                </CardTitle>
                                <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                    Words: <span className={wordCount > 300 ? 'text-red-500' : 'text-primary'}>{wordCount}</span> / {task === 'write-essay' ? '300' : '75'}
                                </div>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 p-6 rounded-2xl border border-border/50 relative overflow-hidden group">
                                {isGenerated && <div className="absolute top-0 right-0 p-2 opacity-50"><Sparkles className="h-10 w-10 text-primary/10" /></div>}
                                <p className="text-sm font-bold text-foreground leading-relaxed italic relative z-10">
                                    {task === 'write-essay' ? questionData.prompt : questionData.text}
                                </p>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 flex-grow flex flex-col">
                            <Textarea
                                placeholder="Begin your matrix input here..."
                                className="flex-grow min-h-[300px] bg-transparent border-none focus-visible:ring-0 resize-none font-mono text-lg leading-relaxed p-0 no-scrollbar"
                                value={textInput}
                                onChange={(e) => setTextInput(e.target.value)}
                                disabled={!!result || isLoading}
                            />
                        </CardContent>
                        <CardFooter className="p-8 border-t bg-muted/20 flex justify-between items-center">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                <History className="h-4 w-4" /> Auto-save active
                            </div>
                            {!result && (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading || wordCount < 5}
                                    className="h-14 px-10 rounded-2xl font-black tracking-widest bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                                    RUN ANALYSIS
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* Feedback & Analytics */}
                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence mode="wait">
                        {result ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <SpotlightCard className="rounded-[2.5rem] border-none bg-[#020617] text-white p-8 shadow-2xl relative">
                                    <h3 className="text-xl font-black mb-8 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles className="h-5 w-5 text-accent-2" /> Grammar Matrix
                                    </h3>

                                    <div className="space-y-8">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-5xl font-black text-primary">{result.overallScore}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">Composite Score</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-2xl font-black text-accent-2">{result.grammarScore}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">Syntax Score</div>
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                                <span>Vocabulary Range</span>
                                                <span>{result.vocabularyScore ? (result.vocabularyScore / 2 * 100).toFixed(0) : '85'}%</span>
                                            </div>
                                            <Progress value={85} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-primary to-accent-2" />
                                        </div>

                                        <div className="pt-6 border-t border-white/10">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-2 mb-2">AI Critique</h4>
                                            <p className="text-xs font-medium leading-relaxed italic opacity-80">
                                                "{result.feedback}"
                                            </p>
                                        </div>

                                        <Button onClick={() => { setResult(null); setTextInput(''); }} className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-widest">
                                            NEW SESSION
                                        </Button>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ) : (
                            <Card className="rounded-[2.5rem] border-2 bg-primary/5 p-8 border-primary/10">
                                <CardHeader className="p-0 mb-6">
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Brain className="h-6 w-6 text-primary" /> Matrix Guide
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-6">
                                    <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Scoring Parameters</h5>
                                        <ul className="space-y-3">
                                            {[
                                                'Content Relevance',
                                                'Form & Vocabulary',
                                                'Grammatical Structure',
                                                'Spelling & Punctuation'
                                            ].map(i => (
                                                <li key={i} className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-primary" /> {i}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-background border border-border/50 text-[10px] font-bold text-muted-foreground italic leading-relaxed">
                                        Note: Ensure you follow the word limit strictly. Summaries must be exactly one sentence ending with a full stop.
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
