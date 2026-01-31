'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mic, StopCircle, Loader2, RefreshCw, Sparkles, AlertTriangle, PlayCircle, Volume2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { scorePteAnswerShortQuestion } from '@/ai/flows/score-pte-speaking-answer-short-question';
import type { PteAnswerShortQuestionInput, PteAnswerShortQuestionOutput } from '@/ai/flows/pte-speaking.types';
import { pteAnswerShortQuestionData } from '@/lib/pte-speaking-answer-short-question-data';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PteAnswerShortQuestionPage() {
    const { toast } = useToast();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'recording' | 'stopped' | 'loading' | 'results'>('idle');
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [result, setResult] = useState<PteAnswerShortQuestionOutput | null>(null);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
    
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);

    const currentQuestion = pteAnswerShortQuestionData[currentQuestionIndex];

    useEffect(() => {
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(() => setHasPermission(true))
            .catch(() => {
                setHasPermission(false);
                toast({ variant: 'destructive', title: 'Microphone Access Denied' });
            });
        
        const handleVoicesChanged = () => {
            const availableVoices = window.speechSynthesis.getVoices().filter(v => v.lang.startsWith('en'));
            setVoices(availableVoices);
            if (!selectedVoiceURI && availableVoices.length > 0) {
                const googleVoice = availableVoices.find(v => v.name.includes('Google') && v.lang.startsWith('en'));
                setSelectedVoiceURI(googleVoice?.voiceURI || availableVoices[0].voiceURI);
            }
        };

        if ('speechSynthesis' in window) {
            window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
            handleVoicesChanged();
        }

        return () => {
            if ('speechSynthesis' in window) {
                window.speechSynthesis.onvoiceschanged = null;
            }
        };
    }, [toast, selectedVoiceURI]);
    
    const playQuestion = () => {
        if ('speechSynthesis' in window) {
            setGameState('playing');
            const utterance = new SpeechSynthesisUtterance(currentQuestion.question);
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
            utterance.onend = () => {
                startRecording();
            };
            utterance.onerror = () => {
                toast({ variant: 'destructive', title: 'Audio Error', description: 'Could not play question audio.'});
                setGameState('idle');
            };
            window.speechSynthesis.speak(utterance);
        } else {
            toast({ variant: 'destructive', title: 'Browser Not Supported', description: 'Your browser does not support speech synthesis.'});
        }
    };

    const startRecording = async () => {
        if (!hasPermission) return;
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
                const testInput: PteAnswerShortQuestionInput = { 
                    questionAudioTranscript: currentQuestion.question,
                    expectedAnswer: currentQuestion.answer,
                    audioDataUri: base64Audio 
                };
                const scoreResult = await scorePteAnswerShortQuestion(testInput);
                setResult(scoreResult);
                setGameState('results');
            };
        } catch (error) {
            toast({ variant: 'destructive', title: 'Scoring Failed' });
            setGameState('stopped');
        }
    };
    
    const handleNext = () => {
        setGameState('idle');
        setResult(null);
        setAudioUrl(null);
        setCurrentQuestionIndex((prev) => (prev + 1) % pteAnswerShortQuestionData.length);
    };

    if (hasPermission === null) return <div className="flex items-center justify-center h-96"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Speaking: Answer Short Question</CardTitle>
                        <CardDescription>You will hear a question. Please give a simple and short answer.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {!hasPermission && <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Microphone Required</AlertTitle><AlertDescription>Please grant microphone access and refresh.</AlertDescription></Alert>}
                        
                        <div className="p-6 my-8 bg-muted/50 rounded-lg text-center min-h-[100px] flex flex-col items-center justify-center gap-6">
                           {gameState === 'idle' && (
                                <>
                                    <div className="w-full max-w-sm space-y-2 text-left">
                                        <Label htmlFor="voice-select">Voice Accent</Label>
                                        <Select
                                            value={selectedVoiceURI}
                                            onValueChange={setSelectedVoiceURI}
                                            disabled={voices.length === 0}
                                        >
                                            <SelectTrigger id="voice-select">
                                                <SelectValue placeholder={voices.length > 0 ? "Select a voice" : "Loading voices..."} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {voices.map(voice => (
                                                    <SelectItem key={voice.voiceURI} value={voice.voiceURI}>
                                                        {voice.name} ({voice.lang})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={playQuestion} disabled={!hasPermission} size="lg"><PlayCircle className="mr-2 h-5 w-5" />Play Question</Button>
                                </>
                           )}
                            {gameState === 'playing' && <div className="flex items-center gap-2 text-lg font-semibold text-primary"><Volume2 className="h-6 w-6 animate-pulse" />Listening...</div>}
                            {gameState === 'recording' && <div className="flex items-center gap-2 text-lg font-semibold text-destructive"><Mic className="h-6 w-6 animate-pulse" />Recording...</div>}
                            {(gameState === 'stopped' || gameState === 'loading' || gameState === 'results') && <p className="text-lg text-muted-foreground font-medium">{currentQuestion.question}</p>}
                        </div>
                        
                         <div className="flex flex-col items-center gap-4">
                            {gameState === 'recording' && <Button onClick={stopRecording} variant="destructive" size="lg"><StopCircle className="mr-2 h-4 w-4" /> Stop Recording</Button>}
                            
                            {(gameState === 'stopped' || gameState === 'loading') && (
                                <div className="space-y-4 text-center w-full max-w-md">
                                    <p className="text-muted-foreground">Recording finished.</p>
                                    {audioUrl && <audio src={audioUrl} controls className="w-full" />}
                                    <div className="flex gap-4">
                                        <Button onClick={() => setGameState('idle')} variant="outline" className="w-full" disabled={gameState === 'loading'}>Retry</Button>
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
                                            {result.isCorrect ? (
                                                <Alert variant="default" className="border-green-500 bg-green-500/10 text-green-900 dark:text-green-100">
                                                    <CheckCircle className="h-4 w-4" />
                                                    <AlertTitle>Correct!</AlertTitle>
                                                </Alert>
                                            ) : (
                                                <Alert variant="destructive">
                                                    <XCircle className="h-4 w-4" />
                                                    <AlertTitle>Incorrect</AlertTitle>
                                                    <AlertDescription>The expected answer was: "{currentQuestion.answer}"</AlertDescription>
                                                </Alert>
                                            )}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                                                <ScoreDisplay title="Overall Score" score={result.overallScore} />
                                                <ScoreDisplay title="Pronunciation" score={result.pronunciationScore} />
                                                <ScoreDisplay title="Fluency" score={result.fluencyScore} />
                                            </div>
                                            <div><h4 className="font-semibold">Your Answer (from AI transcript):</h4><p className="text-muted-foreground p-3 bg-muted rounded-md font-mono text-sm mt-1">"{result.transcript}"</p></div>
                                            <div><h4 className="font-semibold">Feedback:</h4><p className="text-muted-foreground mt-1">{result.feedback}</p></div>
                                            <Button onClick={handleNext} className="w-full" size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Next Question</Button>
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
