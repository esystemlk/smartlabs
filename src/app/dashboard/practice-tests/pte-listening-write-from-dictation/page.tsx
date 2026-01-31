'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, RefreshCw, Sparkles, Volume2, PlayCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { scorePteWriteFromDictation } from '@/ai/flows/score-pte-listening-write-from-dictation';
import type { PteWriteFromDictationInput, PteWriteFromDictationOutput } from '@/ai/flows/pte-listening.types';
import { pteWriteFromDictationData } from '@/lib/pte-listening-write-from-dictation-data';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';


export default function PteWriteFromDictationPage() {
    const { toast } = useToast();
    const [gameState, setGameState] = useState<'idle' | 'playing' | 'writing' | 'loading' | 'results'>('idle');
    const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
    const [writtenText, setWrittenText] = useState('');
    const [result, setResult] = useState<PteWriteFromDictationOutput | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | undefined>();

    const currentSentence = pteWriteFromDictationData[currentSentenceIndex];
    
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
    
    const playSentence = () => {
        if ('speechSynthesis' in window) {
            setGameState('playing');
            const utterance = new SpeechSynthesisUtterance(currentSentence.text);
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.onend = () => setGameState('writing');
            utterance.onerror = () => {
                toast({ variant: 'destructive', title: 'Audio Error' });
                setGameState('idle');
            };
            window.speechSynthesis.speak(utterance);
        }
    };
    
    const handleSubmit = async () => {
        if (!writtenText.trim()) {
            toast({ variant: 'destructive', title: 'Input Required', description: 'Please type the sentence you heard.' });
            return;
        }
        setGameState('loading');
        try {
            const testInput: PteWriteFromDictationInput = { originalSentence: currentSentence.text, writtenSentence: writtenText };
            const scoreResult = await scorePteWriteFromDictation(testInput);
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
        setWrittenText('');
        setCurrentSentenceIndex(prev => (prev + 1) % pteWriteFromDictationData.length);
    };
    
    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Listening: Write from Dictation</CardTitle>
                        <CardDescription>You will hear a sentence. Type the sentence exactly as you hear it.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 my-8 bg-muted/50 rounded-lg text-center min-h-[100px] flex flex-col items-center justify-center gap-6">
                            {gameState === 'idle' && (
                                <>
                                    <div className="w-full max-w-sm space-y-2 text-left">
                                        <Label htmlFor="voice-select">Voice Accent</Label>
                                        <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI} disabled={voices.length === 0}>
                                            <SelectTrigger id="voice-select"><SelectValue placeholder="Select a voice..." /></SelectTrigger>
                                            <SelectContent>{voices.map(v => <SelectItem key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</SelectItem>)}</SelectContent>
                                        </Select>
                                    </div>
                                    <Button onClick={playSentence} size="lg"><PlayCircle className="mr-2 h-5 w-5" />Play Sentence</Button>
                                </>
                            )}
                            {gameState === 'playing' && <div className="flex items-center gap-2 text-lg font-semibold text-primary"><Volume2 className="h-6 w-6 animate-pulse" />Listening...</div>}
                            {(gameState === 'writing' || gameState === 'loading' || gameState === 'results') && <p className="text-base text-muted-foreground">Please type the sentence you heard.</p>}
                        </div>

                        {(gameState === 'writing' || gameState === 'loading' || gameState === 'results') && (
                             <div className="animate-fade-in space-y-4">
                                <Input value={writtenText} onChange={e => setWrittenText(e.target.value)} placeholder="Start typing here..." className="h-12 text-lg" disabled={gameState !== 'writing'}/>
                            </div>
                        )}
                        
                        {gameState === 'writing' && (
                            <Button onClick={handleSubmit} className="mt-6 w-full" size="lg"><Sparkles className="mr-2 h-4 w-4" /> Submit</Button>
                        )}
                        {gameState === 'loading' && <Button disabled className="mt-6 w-full" size="lg"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Scoring...</Button>}

                        {gameState === 'results' && result && (
                            <div className="w-full mt-6 animate-fade-in">
                                <Card className="bg-secondary">
                                    <CardHeader><CardTitle>Your AI-Generated Feedback</CardTitle></CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="text-center">
                                            <p className="text-sm font-medium text-muted-foreground">Score</p>
                                            <p className="text-6xl font-bold text-primary">{result.score}</p>
                                            <Progress value={(result.score / 90) * 100} className="h-2 mt-2 w-full max-w-xs mx-auto" />
                                            <p className="text-sm text-muted-foreground mt-2">{result.correctWords} / {result.totalWords} correct words</p>
                                        </div>
                                         <div><h4 className="font-semibold">Correct Sentence:</h4><p className="text-muted-foreground p-3 bg-muted rounded-md font-mono text-sm mt-1">{currentSentence.text}</p></div>
                                        <div><h4 className="font-semibold">Feedback:</h4><p className="text-muted-foreground mt-1">{result.feedback}</p></div>
                                        <Button onClick={handleNext} className="w-full" size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Next Sentence</Button>
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
