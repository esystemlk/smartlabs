'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
    Mic,
    StopCircle,
    Loader2,
    Sparkles,
    ArrowLeft,
    RotateCcw,
    Volume2,
    ChevronRight,
    TrendingUp,
    Brain,
    Award,
    AlertCircle,
    Play
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { scorePteReadAloud } from '@/ai/flows/score-pte-speaking-read-aloud';
import { scorePteRepeatSentence } from '@/ai/flows/score-pte-speaking-repeat-sentence';
import { scorePteDescribeImage } from '@/ai/flows/score-pte-speaking-describe-image';
import { scorePteRetellLecture } from '@/ai/flows/score-pte-speaking-retell-lecture';
import { scorePteAnswerShortQuestion } from '@/ai/flows/score-pte-speaking-answer-short-question';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { pteSpeakingData } from '@/lib/pte-data';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { SpotlightCard } from '@/components/ui/spotlight-card';

export default function SpeakingTaskPage() {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();

    const section = 'speaking';
    const task = params.task as string;
    const id = parseInt(params.id as string);

    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'preparing' | 'recording' | 'stopped'>('idle');
    const [prepTime, setPrepTime] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Get current question data
    const questionData = (pteSpeakingData as any)[task]?.[id - 1];

    useEffect(() => {
        if (!questionData) {
            router.push(`/dashboard/ai-score-test/${section}`);
        }
    }, [questionData, router, section]);

    useEffect(() => {
        const getPermission = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setHasPermission(true);
                } catch (err) {
                    setHasPermission(false);
                }
            } else {
                setHasPermission(false);
            }
        };
        getPermission();
    }, []);

    const startRecording = async () => {
        if (!hasPermission) return;
        setRecordingStatus('recording');
        setAudioUrl(null);
        audioChunksRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioUrl(URL.createObjectURL(audioBlob));
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && recordingStatus === 'recording') {
            mediaRecorderRef.current.stop();
            setRecordingStatus('stopped');
        }
    };

    const handleSubmit = async () => {
        if (!audioUrl || !questionData) return;
        setIsLoading(true);
        try {
            const audioBlob = await fetch(audioUrl).then(r => r.blob());
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                let scoreResult;

                if (task === 'read-aloud') {
                    scoreResult = await scorePteReadAloud({ text: questionData.text, audioDataUri: base64Audio });
                } else if (task === 'repeat-sentence') {
                    scoreResult = await scorePteRepeatSentence({ originalSentence: questionData.sentence, audioDataUri: base64Audio });
                } else if (task === 'describe-image') {
                    scoreResult = await scorePteDescribeImage({ imageUrl: questionData.imageUrl, audioDataUri: base64Audio });
                } else if (task === 'retell-lecture') {
                    scoreResult = await scorePteRetellLecture({ lectureTranscript: questionData.lectureTranscript, audioDataUri: base64Audio });
                } else if (task === 'answer-short-question') {
                    scoreResult = await scorePteAnswerShortQuestion({ questionAudioTranscript: questionData.question, expectedAnswer: questionData.expectedAnswer, audioDataUri: base64Audio });
                }

                setResult(scoreResult);
                setIsLoading(false);
                toast({ title: "Analysis Complete", description: "AI Matrix has processed your speech profile." });
            };
        } catch (error) {
            setIsLoading(false);
            toast({ variant: 'destructive', title: 'Analysis Failed', description: 'Matrix synchronization error.' });
        }
    };

    if (!questionData) return null;

    return (
        <div className="space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <Button variant="ghost" onClick={() => router.back()} className="group hover:bg-primary/5">
                    <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to List
                </Button>
                <div className="flex items-center gap-4">
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-primary/20 bg-primary/5 text-primary text-[10px] font-black uppercase tracking-widest">
                        Task: {task.replace('-', ' ')}
                    </Badge>
                    <Badge variant="outline" className="rounded-full px-4 py-1.5 border-accent-3/20 bg-accent-3/5 text-accent-3 text-[10px] font-black uppercase tracking-widest">
                        Set #0{id}
                    </Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Interaction Area */}
                <div className="lg:col-span-8 space-y-6">
                    <Card className="rounded-[3rem] border-2 bg-background/50 backdrop-blur-xl shadow-2xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-primary/10 p-10">
                            <CardTitle className="text-3xl font-black font-display tracking-tight text-center lg:text-left uppercase">
                                Initializing <span className="text-primary italic">Live Session</span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-10 space-y-10">
                            {/* Task Content */}
                            <div className="bg-muted/30 p-8 rounded-[2.5rem] border border-border/50 shadow-inner relative group">
                                <div className="absolute top-4 right-6 items-center gap-2 hidden sm:flex opacity-30">
                                    <Brain className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Question Matrix ID: {id}</span>
                                </div>
                                {task === 'read-aloud' && (
                                    <p className="text-2xl font-medium leading-relaxed italic text-foreground/90">"{questionData.text}"</p>
                                )}
                                {task === 'repeat-sentence' && (
                                    <div className="flex flex-col items-center justify-center py-12 gap-8">
                                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center border-2 border-primary/20 animate-pulse">
                                            <Volume2 className="h-10 w-10 text-primary" />
                                        </div>
                                        <div className="text-center">
                                            <p className="text-lg font-black uppercase tracking-widest text-muted-foreground mb-4">Listening Mode Active</p>
                                            <Button variant="outline" className="rounded-2xl h-14 px-10 font-black tracking-widest border-2 hover:bg-primary/10">
                                                <Play className="mr-2 h-4 w-4 fill-primary text-primary" /> PLAY AUDIO
                                            </Button>
                                        </div>
                                    </div>
                                )}
                                {task === 'describe-image' && (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl">
                                            <img src={questionData.imageUrl} alt="PTE Task" className="w-full h-full object-cover" />
                                            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase tracking-widest">
                                                Visual Matrix: {questionData.type}
                                            </div>
                                        </div>
                                        <p className="text-lg font-bold text-center text-muted-foreground">"{questionData.prompt}"</p>
                                    </div>
                                )}
                            </div>

                            {/* Controls */}
                            <div className="flex flex-col items-center gap-8">
                                <AnimatePresence mode="wait">
                                    {recordingStatus === 'idle' && (
                                        <motion.div
                                            key="idle"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <Button
                                                onClick={startRecording}
                                                disabled={!hasPermission}
                                                className="h-24 w-24 rounded-[2.5rem] bg-primary shadow-[0_20px_50px_rgba(79,70,229,0.4)] hover:scale-110 transition-transform p-0"
                                            >
                                                <Mic className="h-10 w-10 text-white" />
                                            </Button>
                                            <p className="text-center mt-6 text-sm font-black uppercase tracking-[0.2em] text-primary">Initialize Microphone</p>
                                        </motion.div>
                                    )}

                                    {recordingStatus === 'recording' && (
                                        <motion.div
                                            key="recording"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="flex flex-col items-center"
                                        >
                                            <div className="relative">
                                                <div className="absolute -inset-8 bg-red-500/20 rounded-full animate-ping" />
                                                <Button
                                                    onClick={stopRecording}
                                                    variant="destructive"
                                                    className="h-24 w-24 rounded-[2.5rem] shadow-[0_20px_50px_rgba(239,68,68,0.4)] relative z-10"
                                                >
                                                    <StopCircle className="h-10 w-10 text-white" />
                                                </Button>
                                            </div>
                                            <p className="text-center mt-12 text-sm font-black uppercase tracking-[0.2em] text-red-500 animate-pulse">Neural Recording Active</p>
                                        </motion.div>
                                    )}

                                    {recordingStatus === 'stopped' && !result && (
                                        <motion.div
                                            key="stopped"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className="w-full max-w-md space-y-6"
                                        >
                                            <div className="bg-muted p-6 rounded-[2rem] border border-border/50">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4 text-center">Spectral Feedback</p>
                                                {audioUrl && <audio src={audioUrl} controls className="w-full" />}
                                            </div>
                                            <div className="flex gap-4">
                                                <Button onClick={() => setRecordingStatus('idle')} variant="outline" className="flex-1 h-14 rounded-2xl font-black tracking-widest border-2 hover:bg-muted">RETRY</Button>
                                                <Button onClick={handleSubmit} disabled={isLoading} className="flex-1 h-14 rounded-2xl font-black tracking-widest bg-primary shadow-xl shadow-primary/20">
                                                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Sparkles className="h-5 w-5 mr-2" />}
                                                    {isLoading ? 'ANALYZING...' : 'RUN MATRIX'}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Analytics Sidebar */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2.5rem] border-2 bg-gradient-to-b from-primary/5 to-transparent p-6">
                        <CardHeader className="p-0 mb-6">
                            <CardTitle className="text-xl font-black flex items-center gap-2">
                                <TrendingUp className="h-5 w-5 text-primary" /> Matrix Live Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 space-y-4">
                            {[
                                { label: 'Scoring Precision', val: '99.9%', color: 'text-primary' },
                                { label: 'Acoustic Clarity', val: 'Detecting...', color: 'text-muted-foreground italic' },
                                { label: 'Fluency Buffer', val: 'Ready', color: 'text-green-500' }
                            ].map((stat, i) => (
                                <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-background border border-border/50 shadow-sm">
                                    <span className="text-xs font-black uppercase tracking-widest opacity-60">{stat.label}</span>
                                    <span className={`text-sm font-black ${stat.color}`}>{stat.val}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2.5rem] border-2 bg-accent-1/5 border-accent-1/10 p-6 relative overflow-hidden group">
                        <div className="absolute top-2 right-2 opacity-5 translate-x-4">
                            <AlertCircle className="h-32 w-32" />
                        </div>
                        <h4 className="text-sm font-black uppercase tracking-widest text-accent-1 mb-4">Exam Requirement</h4>
                        <p className="text-xs font-bold leading-relaxed text-muted-foreground relative z-10">
                            You must start speaking within 3 seconds of the beep. If you wait longer, the recording will automatically end and discard your input.
                        </p>
                    </Card>

                    {result && (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                        >
                            <SpotlightCard className="rounded-[2.5rem] border-none bg-[#020617] text-white p-8 shadow-2xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-8 opacity-10">
                                    <Award className="h-24 w-24" />
                                </div>
                                <h3 className="text-xl font-black mb-8 uppercase tracking-widest flex items-center gap-2">
                                    <Sparkles className="h-5 w-5 text-accent-3" /> Matrix Analysis
                                </h3>

                                <div className="space-y-8">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <div className="text-5xl font-black text-primary">{result.overallScore}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">Global Composite</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-black text-accent-1">{result.pronunciationScore}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest opacity-50 mt-1">Phonetic Score</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em]">
                                            <span>Oral Fluency</span>
                                            <span>{result.fluencyScore}%</span>
                                        </div>
                                        <Progress value={result.fluencyScore} className="h-2 bg-white/10" indicatorClassName="bg-gradient-to-r from-primary to-accent-3" />
                                    </div>

                                    <div className="pt-6 border-t border-white/10">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-3 mb-2 text-center">AI Diagnostics</h4>
                                        <p className="text-xs font-medium leading-relaxed italic opacity-80 text-center">
                                            "{result.feedback}"
                                        </p>
                                    </div>

                                    <Button onClick={() => setResult(null)} className="w-full h-14 rounded-2xl bg-white text-black hover:bg-white/90 font-black tracking-widest">
                                        NEXT CASE FILE
                                    </Button>
                                </div>
                            </SpotlightCard>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
