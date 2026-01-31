'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Mic, StopCircle, Loader2, RefreshCw, Sparkles, AlertTriangle, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { scorePteDescribeImage } from '@/ai/flows/score-pte-speaking-describe-image';
import type { PteDescribeImageInput, PteDescribeImageOutput } from '@/ai/flows/pte-speaking.types';
import { Progress } from '@/components/ui/progress';

const imageUrl = "https://picsum.photos/seed/describe-image-1/800/600";
const PREPARATION_TIME = 25; // seconds

export default function PteDescribeImagePage() {
    const { toast } = useToast();
    const [gameState, setGameState] = useState<'idle' | 'preparing' | 'recording' | 'stopped' | 'loading' | 'results'>('idle');
    const [countdown, setCountdown] = useState(PREPARATION_TIME);
    const [result, setResult] = useState<PteDescribeImageOutput | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout>();

    // Permission Check
    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => setHasPermission(true))
            .catch(() => {
                setHasPermission(false);
                toast({
                    variant: 'destructive',
                    title: 'Microphone Access Denied',
                    description: 'Please enable microphone permissions to use this feature.',
                });
            });
    }, [toast]);
    
    // Countdown Timer Logic
    useEffect(() => {
        if (gameState === 'preparing') {
            setCountdown(PREPARATION_TIME);
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        startRecording();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);


    const startPreparation = () => {
        if (!hasPermission) {
            toast({ variant: 'destructive', title: 'No microphone permission' });
            return;
        }
        setGameState('preparing');
    };

    const startRecording = async () => {
        setGameState('recording');
        audioChunksRef.current = [];
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);
        mediaRecorderRef.current.ondataavailable = (event) => audioChunksRef.current.push(event.data);
        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            setAudioUrl(URL.createObjectURL(audioBlob));
            stream.getTracks().forEach(track => track.stop());
        };
        mediaRecorderRef.current.start();
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && gameState === 'recording') {
            mediaRecorderRef.current.stop();
            setGameState('stopped');
        }
    };

    const handleSubmit = async () => {
        if (!audioUrl) return;
        setGameState('loading');
        try {
            const audioBlob = await fetch(audioUrl).then(r => r.blob());
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                const testInput: PteDescribeImageInput = { imageUrl, audioDataUri: base64Audio };
                const scoreResult = await scorePteDescribeImage(testInput);
                setResult(scoreResult);
                setGameState('results');
            };
        } catch (error) {
            toast({ variant: 'destructive', title: 'Scoring Failed', description: 'Could not get feedback from the AI.' });
            setGameState('stopped');
        }
    };
    
    const handleRetry = () => {
        setGameState('idle');
        setResult(null);
        setAudioUrl(null);
    };

    if (hasPermission === null) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Speaking: Describe Image</CardTitle>
                        <CardDescription>You have 25 seconds to study the image. Then, describe the image in detail in 40 seconds.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasPermission && (
                            <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Microphone Required</AlertTitle><AlertDescription>Please grant microphone access and refresh.</AlertDescription></Alert>
                        )}
                        
                        <div className="p-4 my-8 bg-muted/50 rounded-lg relative aspect-video">
                            <Image src={imageUrl} alt="Practice image for PTE describe image task" fill className="object-contain rounded-md" data-ai-hint="data chart graph" />
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            {gameState === 'idle' && <Button onClick={startPreparation} disabled={!hasPermission} size="lg"><Timer className="mr-2 h-4 w-4" /> Start Preparation</Button>}
                            {gameState === 'preparing' && <div className="text-center"><p className="text-lg font-semibold">Prepare to speak...</p><p className="text-6xl font-bold text-primary">{countdown}</p></div>}
                            {gameState === 'recording' && <Button onClick={stopRecording} variant="destructive" size="lg" className="animate-pulse"><StopCircle className="mr-2 h-4 w-4" /> Stop Recording</Button>}
                            
                            {(gameState === 'stopped' || gameState === 'loading') && (
                                <div className="space-y-4 text-center w-full max-w-md">
                                    <p className="text-muted-foreground">Recording finished. You can listen to it below.</p>
                                    {audioUrl && <audio src={audioUrl} controls className="w-full" />}
                                    <div className="flex gap-4">
                                        <Button onClick={handleRetry} variant="outline" className="w-full" disabled={gameState === 'loading'}>Retry</Button>
                                        <Button onClick={handleSubmit} disabled={gameState === 'loading'} className="w-full">
                                            {gameState === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                            {gameState === 'loading' ? 'Scoring...' : 'Submit'}
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {gameState === 'results' && result && (
                                <div className="w-full mt-6 animate-fade-in">
                                    <Card className="bg-secondary">
                                        <CardHeader><CardTitle>Your AI-Generated Feedback</CardTitle></CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                                <ScoreDisplay title="Overall Score" score={result.overallScore} />
                                                <ScoreDisplay title="Content" score={result.contentScore} />
                                                <ScoreDisplay title="Pronunciation" score={result.pronunciationScore} />
                                                <ScoreDisplay title="Fluency" score={result.fluencyScore} />
                                            </div>
                                            <div><h4 className="font-semibold">AI Transcript:</h4><p className="text-muted-foreground p-3 bg-muted rounded-md font-mono text-sm mt-1">"{result.transcript}"</p></div>
                                            <div><h4 className="font-semibold">Feedback:</h4><p className="text-muted-foreground mt-1">{result.feedback}</p></div>
                                            <Button onClick={handleRetry} className="w-full" size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
                                        </CardContent>
                                    </Card>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ScoreDisplay({ title, score }: { title: string; score: number }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-primary">{score}</p>
            <Progress value={(score/90)*100} className="h-1.5 mt-2 w-full" />
        </div>
    )
}
