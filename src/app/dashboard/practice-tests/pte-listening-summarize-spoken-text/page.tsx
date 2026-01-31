'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Sparkles, PlayCircle, Volume2, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { scorePteSummarizeSpokenText } from '@/ai/flows/score-pte-listening-summarize-spoken-text';
import type { PteSummarizeSpokenTextInput, PteSummarizeSpokenTextOutput } from '@/ai/flows/pte-listening.types';
import { pteSummarizeSpokenTextData } from '@/lib/pte-listening-summarize-spoken-text-data';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const COUNTDOWN_TIME = 10; // seconds

export default function PteSummarizeSpokenTextPage() {
    const { toast } = useToast();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'writing' | 'loading' | 'results'>('idle');
    const [currentLectureIndex, setCurrentLectureIndex] = useState(0);
    const [countdown, setCountdown] = useState(COUNTDOWN_TIME);
    const [summary, setSummary] = useState('');
    const [result, setResult] = useState<PteSummarizeSpokenTextOutput | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
    const timerRef = useRef<NodeJS.Timeout>();

    const currentLecture = pteSummarizeSpokenTextData[currentLectureIndex];

    useEffect(() => {
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
    }, [selectedVoiceURI]);
    
    useEffect(() => {
        if (gameState === 'writing') {
            timerRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        // Optional: auto-submit when timer ends
                        // handleSubmit();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [gameState]);

    const playLecture = () => {
        if ('speechSynthesis' in window) {
            setGameState('playing');
            const utterance = new SpeechSynthesisUtterance(currentLecture.transcript);
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.onend = () => {
                setCountdown(COUNTDOWN_TIME * 60); // 10 minutes in seconds
                setGameState('writing');
            };
            utterance.onerror = () => {
                toast({ variant: 'destructive', title: 'Audio Error' });
                setGameState('idle');
            };
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSubmit = async () => {
        const wordCount = summary.split(/\s+/).filter(Boolean).length;
        if (wordCount < 50 || wordCount > 70) {
            toast({ variant: 'destructive', title: 'Word Count Error', description: 'Your summary must be between 50 and 70 words.' });
            return;
        }

        setGameState('loading');
        try {
            const testInput: PteSummarizeSpokenTextInput = { lectureTranscript: currentLecture.transcript, summary };
            const scoreResult = await scorePteSummarizeSpokenText(testInput);
            setResult(scoreResult);
            setGameState('results');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Scoring Failed' });
            setGameState('writing');
        }
    };
    
    const handleNext = () => {
        setGameState('idle');
        setResult(null);
        setSummary('');
        setCurrentLectureIndex(prev => (prev + 1) % pteSummarizeSpokenTextData.length);
    };

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Listening: Summarize Spoken Text</CardTitle>
                        <CardDescription>You will hear a short lecture. Write a summary of 50-70 words. You have 10 minutes.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 my-8 bg-muted/50 rounded-lg text-center min-h-[100px] flex flex-col items-center justify-center gap-6">
                            <h3 className="text-lg font-semibold">{currentLecture.title}</h3>
                            {gameState === 'idle' && (
                                <>
                                    <div className="w-full max-w-sm space-y-2 text-left">
                                        <Label htmlFor="voice-select">Voice Accent</Label>
                                        <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI} disabled={voices.length === 0}>
                                            <SelectTrigger id="voice-select"><SelectValue placeholder="Select a voice..." /></SelectTrigger>
                                            <SelectContent>{voices.map(v => <SelectItem key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={playLecture} size="lg"><PlayCircle className="mr-2 h-5 w-5" />Play Lecture</Button>
                                </>
                            )}
                            {gameState === 'playing' && <div className="flex items-center gap-2 text-lg font-semibold text-primary"><Volume2 className="h-6 w-6 animate-pulse" />Listening...</div>}
                            {(gameState === 'writing' || gameState === 'loading' || gameState === 'results') && <p className="text-base text-muted-foreground">The lecture has ended. Please write your summary below.</p>}
                        </div>
                        
                        {(gameState === 'writing' || gameState === 'loading' || gameState === 'results') && (
                             <div className="animate-fade-in space-y-4">
                                {gameState === 'writing' && (
                                    <div className="flex justify-between items-center p-2 rounded-lg bg-secondary">
                                        <div className="flex items-center gap-2 font-semibold">
                                            <Timer className="h-5 w-5 text-primary" />
                                            Time Remaining: {Math.floor(countdown / 60)}:{('0' + (countdown % 60)).slice(-2)}
                                        </div>
                                    </div>
                                )}
                                <Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="Write your summary here (50-70 words)..." className="min-h-48 text-base" disabled={gameState !== 'writing'}/>
                                <p className="text-sm text-muted-foreground">{summary.split(/\s+/).filter(Boolean).length} words</p>
                            </div>
                        )}

                        {gameState === 'writing' && (
                             <Button onClick={handleSubmit} className="mt-6 w-full" size="lg">
                                <Sparkles className="mr-2 h-4 w-4" /> Submit Summary
                            </Button>
                        )}
                        {gameState === 'loading' && <Button disabled className="mt-6 w-full" size="lg"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scoring...</Button>}

                        {gameState === 'results' && result && (
                            <div className="w-full mt-6 animate-fade-in">
                                <Card className="bg-secondary">
                                    <CardHeader><CardTitle>Your AI-Generated Feedback</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <ScoreDisplay title="Overall" score={result.overallScore} maxScore={10} />
                                            <ScoreDisplay title="Content" score={result.contentScore} maxScore={2} />
                                            <ScoreDisplay title="Form" score={result.formScore} maxScore={2} />
                                            <ScoreDisplay title="Grammar" score={result.grammarScore} maxScore={2} />
                                            <ScoreDisplay title="Vocabulary" score={result.vocabularyScore} maxScore={2} />
                                            <ScoreDisplay title="Spelling" score={result.spellingScore} maxScore={2} />
                                        </div>
                                        <div><h4 className="font-semibold">Feedback:</h4><p className="text-muted-foreground mt-1">{result.feedback}</p></div>
                                        <Button onClick={handleNext} className="w-full" size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Next Lecture</Button>
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

function ScoreDisplay({ title, score, maxScore }: { title: string; score: number; maxScore: number }) {
    return (
        <div className="flex flex-col items-center justify-center p-4 bg-background rounded-lg">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-4xl font-bold text-primary">{score}</p>
            <Progress value={(score / maxScore) * 100} className="h-1.5 mt-2 w-full" />
        </div>
    )
}
