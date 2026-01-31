'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle, PlayCircle, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pteListeningMultipleChoiceMultipleAnswerData } from '@/lib/pte-listening-multiple-choice-multiple-answer-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function PteListeningMultipleChoiceMultipleAnswerPage() {
    const [currentTest] = useState(pteListeningMultipleChoiceMultipleAnswerData[0]);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const { toast } = useToast();
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();
    const [isPlaying, setIsPlaying] = useState(false);

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
                window.speechSynthesis.cancel();
            }
        };
    }, [selectedVoiceURI]);
    
    const playAudio = () => {
        if ('speechSynthesis' in window) {
            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(currentTest.audioText);
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => {
                toast({ variant: 'destructive', title: 'Audio Error' });
                setIsPlaying(false);
            };
            window.speechSynthesis.speak(utterance);
        }
    };


    const handleCheckboxChange = (option: string, checked: boolean) => {
        if (checked) {
            setSelectedAnswers(prev => [...prev, option]);
        } else {
            setSelectedAnswers(prev => prev.filter(ans => ans !== option));
        }
    };

    const handleSubmit = () => setIsSubmitted(true);
    const handleRetry = () => {
        setSelectedAnswers([]);
        setIsSubmitted(false);
    };

    const calculateScore = () => {
        if (!isSubmitted) return { score: 0, maxScore: currentTest.correctAnswers.length };
        
        let score = 0;
        for (const answer of selectedAnswers) {
            if (currentTest.correctAnswers.includes(answer)) {
                score++;
            } else {
                score--;
            }
        }
        return { score: Math.max(0, score), maxScore: currentTest.correctAnswers.length };
    };

    const { score, maxScore } = calculateScore();

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Listening: Multiple-Choice, Multiple Answer</CardTitle>
                        <CardDescription>Listen to the recording and answer the question by selecting all the correct responses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <div className="p-6 my-8 bg-muted/50 rounded-lg text-center min-h-[100px] flex flex-col items-center justify-center gap-6">
                            {isPlaying ? (
                                <div className="flex items-center gap-2 text-lg font-semibold text-primary"><Volume2 className="h-6 w-6 animate-pulse" />Listening...</div>
                            ) : (
                                <>
                                     <div className="w-full max-w-sm space-y-2 text-left">
                                        <Label htmlFor="voice-select">Voice Accent</Label>
                                        <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI} disabled={voices.length === 0}>
                                            <SelectTrigger id="voice-select"><SelectValue placeholder="Select a voice..." /></SelectTrigger>
                                            <SelectContent>{voices.map(v => <SelectItem key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={playAudio} size="lg"><PlayCircle className="mr-2 h-5 w-5" />Play Audio</Button>
                                </>
                            )}
                        </div>

                        <div className="space-y-4">
                            <p className="font-semibold text-lg">{currentTest.question}</p>
                            <div className="space-y-3">
                                {currentTest.options.map(option => {
                                    const isSelected = selectedAnswers.includes(option);
                                    const isCorrectAnswer = currentTest.correctAnswers.includes(option);
                                    
                                    let state: 'correct' | 'incorrect' | 'missed' | 'default' = 'default';
                                    if(isSubmitted) {
                                        if (isSelected && isCorrectAnswer) state = 'correct';
                                        else if (isSelected && !isCorrectAnswer) state = 'incorrect';
                                        else if (!isSelected && isCorrectAnswer) state = 'missed';
                                    }

                                    return (
                                        <div key={option} className={cn("flex items-start space-x-3 p-3 rounded-md border transition-all", 
                                            state === 'correct' && "border-green-500 bg-green-500/10",
                                            state === 'incorrect' && "border-red-500 bg-red-500/10",
                                            state === 'missed' && "border-blue-500 bg-blue-500/10"
                                        )}>
                                            <Checkbox id={option} checked={isSelected} onCheckedChange={(checked) => handleCheckboxChange(option, !!checked)} disabled={isSubmitted}/>
                                            <Label htmlFor={option} className="flex-1 cursor-pointer text-base">
                                                {option}
                                                {state === 'correct' && <span className="ml-2 font-semibold text-green-700">(Correctly selected)</span>}
                                                {state === 'incorrect' && <span className="ml-2 font-semibold text-red-700">(Incorrectly selected)</span>}
                                                {state === 'missed' && <span className="ml-2 font-semibold text-blue-700">(Correct answer, missed)</span>}
                                            </Label>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        <div className="flex flex-col items-center gap-4 mt-8">
                            {!isSubmitted ? (
                                <Button onClick={handleSubmit} size="lg">Submit Answers</Button>
                            ) : (
                                <div className="w-full space-y-6">
                                    <Card className="bg-secondary">
                                        <CardHeader><CardTitle>Your Result</CardTitle></CardHeader>
                                        <CardContent className="text-center">
                                            <p className="text-6xl font-bold text-primary">{score}<span className="text-2xl text-muted-foreground">/{maxScore}</span></p>
                                            <p className="text-muted-foreground">points</p>
                                        </CardContent>
                                    </Card>
                                    <Button onClick={handleRetry} size="lg" variant="outline" className="w-full">
                                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
