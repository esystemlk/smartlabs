'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Headphones,
    ArrowLeft,
    ChevronRight,
    Volume2,
    Play,
    RotateCcw,
    Sparkles,
    Zap,
    Award,
    Clock,
    Mic2,
    FileAudio
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { pteListeningData } from '@/lib/pte-data';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { scorePteSummarizeSpokenText } from '@/ai/flows/score-pte-listening-summarize-spoken-text';
import { scorePteWriteFromDictation } from '@/ai/flows/score-pte-listening-write-from-dictation';
import { Progress } from '@/components/ui/progress';

export default function ListeningTaskPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const section = 'listening';
    const task = params.task as string;
    const id = parseInt(params.id as string);

    const [textInput, setTextInput] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes for SST, less for others

    const questionData = (pteListeningData as any)[task]?.[id - 1];

    useEffect(() => {
        if (!questionData) {
            router.push(`/dashboard/ai-score-test/${section}`);
        } else {
            setTimeLeft(task === 'summarize-spoken-text' ? 10 * 60 : 2 * 60);
        }
    }, [questionData, router, section, task]);

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

    const handleSubmit = async () => {
        if (!textInput.trim()) return;
        setIsLoading(true);
        try {
            let scoreResult;
            if (task === 'summarize-spoken-text') {
                scoreResult = await scorePteSummarizeSpokenText({
                    lectureTranscript: questionData.transcript,
                    summary: textInput
                });
            } else if (task === 'write-from-dictation') {
                scoreResult = await scorePteWriteFromDictation({
                    originalSentence: questionData.sentence,
                    writtenSentence: textInput
                });
            }
            setResult(scoreResult);
            setIsSubmitted(true);
            setIsLoading(false);
            toast({ title: "Analysis Complete", description: "AI Matrix has evaluated your acoustic proficiency." });
        } catch (error) {
            setIsLoading(false);
            toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Could not sync with AI Matrix.' });
        }
    };

    if (!questionData) return null;

    const wordCount = textInput.split(/\s+/).filter(Boolean).length;

    return (
        <div className="space-y-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="group hover:bg-primary/5">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Matrix
                </Button>
                <div className="flex items-center gap-4">
                    <div className={`px-4 py-1.5 rounded-full border border-border/50 bg-card flex items-center gap-2 font-black text-xs ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                        <Clock className="h-4 w-4" /> {formatTime(timeLeft)}
                    </div>
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-accent-4/20 bg-accent-4/5 text-accent-4 text-[10px] font-black uppercase tracking-widest">
                        {task.replace('-', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Acoustic Interface */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="rounded-[3rem] border-2 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 p-10">
                            <CardTitle className="text-3xl font-black font-display tracking-tight text-center lg:text-left flex items-center gap-4">
                                ACOUSTIC <span className="text-primary italic">INPUT MATRIX</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            {/* Audio Controller */}
                            <div className="bg-muted/30 p-10 rounded-[2.5rem] border border-border/50 shadow-inner flex flex-col items-center gap-6">
                                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 group">
                                    <Volume2 className="h-10 w-10 text-primary group-hover:scale-110 transition-transform" />
                                </div>
                                <div className="text-center">
                                    <p className="text-sm font-black uppercase tracking-[0.2em] text-muted-foreground mb-6">Master Audio Stream #0{id}</p>
                                    <Button variant="outline" className="rounded-2xl h-16 px-12 font-black tracking-widest border-2 hover:bg-primary/10 transition-all">
                                        <Play className="mr-3 h-5 w-5 fill-primary text-primary" /> PLAY RECORDING
                                    </Button>
                                </div>
                            </div>

                            {/* Transcoding Area */}
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">User Transcoding Buffer</h4>
                                    <div className="text-[10px] font-black uppercase tracking-widest text-primary">
                                        Word Count: {wordCount} {task === 'summarize-spoken-text' && '/ 70'}
                                    </div>
                                </div>
                                {task === 'summarize-spoken-text' ? (
                                    <Textarea
                                        placeholder="Enter your summary here (50-70 words)..."
                                        className="min-h-[250px] rounded-[2rem] bg-background/50 border-2 focus:ring-primary font-medium text-lg p-8"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        disabled={isSubmitted || isLoading}
                                    />
                                ) : (
                                    <Input
                                        placeholder="Type the sentence exactly as you heard it..."
                                        className="h-20 rounded-2xl bg-background/50 border-2 focus:ring-primary font-bold text-lg px-8"
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        disabled={isSubmitted || isLoading}
                                    />
                                )}
                            </div>
                        </CardContent>
                        <CardFooter className="p-10 border-t bg-muted/20 flex justify-end">
                            {!isSubmitted ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isLoading || !textInput.trim()}
                                    className="h-16 px-12 rounded-2xl font-black tracking-widest bg-primary shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
                                >
                                    {isLoading ? <RotateCcw className="h-6 w-6 animate-spin mr-3" /> : <Zap className="h-6 w-6 mr-3 text-white" />}
                                    RUN MATRIX EVALUATION
                                </Button>
                            ) : (
                                <Button onClick={() => router.back()} variant="outline" className="h-16 px-12 rounded-2xl font-black tracking-widest border-2">
                                    CONTINUE PIPELINE <ChevronRight className="ml-3 h-6 w-6" />
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                </div>

                {/* Spectral Feedback */}
                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence mode="wait">
                        {isSubmitted && result ? (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="space-y-6"
                            >
                                <SpotlightCard className="rounded-[2.5rem] border-none bg-[#020617] text-white p-10 shadow-2xl relative">
                                    <div className="absolute top-0 right-0 p-10 opacity-10">
                                        <Award className="h-24 w-24" />
                                    </div>
                                    <h3 className="text-xl font-black mb-10 uppercase tracking-widest text-accent-4 flex items-center gap-3">
                                        <Sparkles className="h-6 w-6" /> SPECTRAL REPORT
                                    </h3>

                                    <div className="space-y-10">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-6xl font-black text-primary">{result.overallScore}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Neural Balance</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-3xl font-black text-accent-4">{result.contentScore || result.score || result.overallScore}</div>
                                                <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-2">Lexical Precision</div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                                <span>Acoustic Sync</span>
                                                <span>{result.overallScore}%</span>
                                            </div>
                                            <Progress value={result.overallScore} className="h-2.5 bg-white/10" indicatorClassName="bg-gradient-to-r from-primary to-accent-4" />
                                        </div>

                                        <div className="pt-8 border-t border-white/10">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-4 mb-4">AI ANALYTICS</h4>
                                            <p className="text-xs font-medium leading-relaxed italic opacity-80">
                                                "{result.feedback}"
                                            </p>
                                        </div>

                                        <Button onClick={() => { setIsSubmitted(false); setResult(null); setTextInput(''); }} className="w-full h-16 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-widest transition-all">
                                            DOWNLOAD LOGS & RESTART
                                        </Button>
                                    </div>
                                </SpotlightCard>
                            </motion.div>
                        ) : (
                            <Card className="rounded-[2.5rem] border-2 bg-primary/5 p-10 border-primary/10">
                                <CardHeader className="p-0 mb-8">
                                    <CardTitle className="text-2xl font-black flex items-center gap-3">
                                        <Mic2 className="h-8 w-8 text-primary" /> Matrix Protocols
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0 space-y-8">
                                    <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Evaluation Nodes</h5>
                                        <ul className="space-y-4">
                                            {[
                                                'Content Retention',
                                                'Form Manipulation',
                                                'Grammar Node Sync',
                                                'Lexical Vocabulary'
                                            ].map(i => (
                                                <li key={i} className="flex items-center gap-3 text-sm font-bold text-muted-foreground">
                                                    <div className="h-2 w-2 rounded-full bg-primary" /> {i}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="p-6 rounded-2xl bg-background border border-border/50 text-xs font-bold text-muted-foreground italic leading-relaxed">
                                        Pro Node: In SST, ensure you cover all main points from the lecture transcript. For Dictation, precision in spelling and punctuation is critical for matrix sync.
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
