'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, StopCircle, Loader2, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { scorePteReadAloud } from '@/ai/flows/score-pte-speaking-read-aloud';
import type { PteReadAloudInput, PteReadAloudOutput } from '@/ai/flows/pte-speaking.types';
import { Progress } from '@/components/ui/progress';


const testText = "The concept of 'smart cities' is a topic of increasing interest. A smart city uses information and communication technology (ICT) to improve operational efficiency and provide a better quality of government service and citizen welfare.";

export default function PteReadAloudPage() {
    const { toast } = useToast();
    const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'stopped'>('idle');
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<PteReadAloudOutput | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    useEffect(() => {
        const getPermission = async () => {
            if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
                try {
                    await navigator.mediaDevices.getUserMedia({ audio: true });
                    setHasPermission(true);
                } catch (err) {
                    console.error("Microphone permission denied:", err);
                    setHasPermission(false);
                    toast({
                        variant: 'destructive',
                        title: 'Microphone Access Denied',
                        description: 'Please enable microphone permissions in your browser settings to use this feature.',
                    });
                }
            } else {
                setHasPermission(false);
                 toast({
                    variant: 'destructive',
                    title: 'Unsupported Browser',
                    description: 'Your browser does not support audio recording.',
                });
            }
        };
        getPermission();
    }, [toast]);

    const startRecording = async () => {
        if (!hasPermission) {
            toast({ variant: 'destructive', title: 'No microphone permission' });
            return;
        }
        setRecordingStatus('recording');
        setAudioUrl(null);
        audioChunksRef.current = [];

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaRecorderRef.current = new MediaRecorder(stream);

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunksRef.current.push(event.data);
            }
        };

        mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const url = URL.createObjectURL(audioBlob);
            setAudioUrl(url);
            // Stop all media tracks to turn off the recording indicator
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
        if (!audioUrl) {
            toast({ variant: 'destructive', title: 'No audio recorded' });
            return;
        }

        setIsLoading(true);
        setResult(null);

        try {
            const audioBlob = await fetch(audioUrl).then(r => r.blob());
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result as string;
                if (!base64Audio) {
                    throw new Error("Failed to convert audio to Base64");
                }
                const testInput: PteReadAloudInput = {
                    text: testText,
                    audioDataUri: base64Audio,
                };
                const scoreResult = await scorePteReadAloud(testInput);
                setResult(scoreResult);
                setIsLoading(false);
            };
        } catch (error) {
            console.error("Scoring failed:", error);
            toast({ variant: 'destructive', title: 'Scoring Failed', description: 'Could not get feedback from the AI. Please try again.' });
            setIsLoading(false);
        }
    };
    
    const handleRetry = () => {
        setRecordingStatus('idle');
        setResult(null);
        setAudioUrl(null);
        setIsLoading(false);
    };

    const isTestTaken = result !== null;

    if (hasPermission === null) {
        return (
             <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
        )
    }

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost">
                    <Link href="/dashboard/practice-tests">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Practice Tests
                    </Link>
                </Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Speaking: Read Aloud</CardTitle>
                        <CardDescription>You have 30-40 seconds to prepare. Then, read the text below clearly. You will be scored on content, pronunciation, and fluency.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasPermission && (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertTitle>Microphone Required</AlertTitle>
                                <AlertDescription>
                                    This practice test requires microphone access. Please grant permission in your browser and refresh the page.
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="p-6 my-8 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Read this text aloud:</h3>
                            <p className="text-foreground text-xl leading-relaxed">{testText}</p>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            {recordingStatus === 'idle' && (
                                <Button onClick={startRecording} disabled={!hasPermission || isTestTaken} size="lg">
                                    <Mic className="mr-2 h-4 w-4" /> Start Recording
                                </Button>
                            )}
                            {recordingStatus === 'recording' && (
                                <Button onClick={stopRecording} variant="destructive" size="lg" className="animate-pulse">
                                    <StopCircle className="mr-2 h-4 w-4" /> Stop Recording
                                </Button>
                            )}
                            {recordingStatus === 'stopped' && !isTestTaken && (
                                <div className="space-y-4 text-center w-full max-w-md">
                                    <p className="text-muted-foreground">Recording finished. You can listen to your recording below.</p>
                                    {audioUrl && <audio src={audioUrl} controls className="w-full" />}
                                    <div className="flex gap-4">
                                        <Button onClick={handleRetry} variant="outline" className="w-full">Retry</Button>
                                        <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
                                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                            {isLoading ? 'Scoring...' : 'Submit'}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {isTestTaken && result && (
                            <div className="mt-10 animate-fade-in">
                                <Card className="bg-secondary">
                                    <CardHeader>
                                        <CardTitle>Your AI-Generated Feedback</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                                            <ScoreDisplay title="Overall Score" score={result.overallScore} />
                                            <ScoreDisplay title="Content" score={result.contentScore} />
                                            <ScoreDisplay title="Pronunciation" score={result.pronunciationScore} />
                                            <ScoreDisplay title="Fluency" score={result.fluencyScore} />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">AI Transcript:</h4>
                                            <p className="text-muted-foreground p-3 bg-muted rounded-md font-mono text-sm mt-1">"{result.transcript}"</p>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">Feedback:</h4>
                                            <p className="text-muted-foreground mt-1">{result.feedback}</p>
                                        </div>
                                        <Button onClick={handleRetry} className="w-full" size="lg" variant="outline">
                                            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
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
