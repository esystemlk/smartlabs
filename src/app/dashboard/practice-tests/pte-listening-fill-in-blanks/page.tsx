
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import React from 'react';
import { ArrowLeft, PlayCircle, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { pteListeningFillInBlanksData } from '@/lib/pte-listening-fill-in-blanks-data';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function PteListeningFillInBlanksPage() {
    const [currentTest] = useState(pteListeningFillInBlanksData[0]);
    const [answers, setAnswers] = useState<string[]>(Array(currentTest.correctWords.length).fill(''));
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
        return () => { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); };
    }, [selectedVoiceURI]);

    const playAudio = () => {
        if ('speechSynthesis' in window) {
            setIsPlaying(true);
            const utterance = new SpeechSynthesisUtterance(currentTest.audioText);
            const selectedVoice = voices.find(v => v.voiceURI === selectedVoiceURI);
            if (selectedVoice) utterance.voice = selectedVoice;
            utterance.onend = () => setIsPlaying(false);
            utterance.onerror = () => { toast({ variant: 'destructive', title: 'Audio Error' }); setIsPlaying(false); };
            window.speechSynthesis.speak(utterance);
        }
    };
    
    const handleInputChange = (index: number, value: string) => {
        const newAnswers = [...answers];
        newAnswers[index] = value;
        setAnswers(newAnswers);
    };

    const handleSubmit = () => setIsSubmitted(true);
    const handleRetry = () => {
        setAnswers(Array(currentTest.correctWords.length).fill(''));
        setIsSubmitted(false);
    };
    
    const transcriptParts = currentTest.transcript.split('{BLANK}');

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Listening: Fill in the Blanks</CardTitle>
                        <CardDescription>You will hear a recording. Type the missing words in each blank.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 my-8 bg-muted/50 rounded-lg text-center min-h-[100px] flex flex-col items-center justify-center gap-6">
                            {isPlaying ? <div className="flex items-center gap-2 text-lg font-semibold text-primary"><Volume2 className="h-6 w-6 animate-pulse" />Listening...</div>
                                : <>
                                    <div className="w-full max-w-sm space-y-2 text-left">
                                        <Label htmlFor="voice-select">Voice Accent</Label>
                                        <Select value={selectedVoiceURI} onValueChange={setSelectedVoiceURI} disabled={voices.length === 0}><SelectTrigger id="voice-select"><SelectValue placeholder="Select a voice..." /></SelectTrigger><SelectContent>{voices.map(v => <SelectItem key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</SelectItem>)}</SelectContent></Select>
                                    </div>
                                    <Button onClick={playAudio} size="lg"><PlayCircle className="mr-2 h-5 w-5" />Play Audio</Button>
                                </>
                            }
                        </div>

                        <div className="p-6 bg-background rounded-lg border text-lg leading-relaxed space-x-1">
                           {transcriptParts.map((part, index) => (
                               <React.Fragment key={index}>
                                   {part}
                                   {index < currentTest.correctWords.length && (
                                       <Input
                                            type="text"
                                            value={answers[index]}
                                            onChange={(e) => handleInputChange(index, e.target.value)}
                                            disabled={isSubmitted}
                                            className={cn("inline-block w-40 h-8 text-lg px-2",
                                                isSubmitted && answers[index].toLowerCase() === currentTest.correctWords[index].toLowerCase() && "bg-green-100 border-green-500",
                                                isSubmitted && answers[index].toLowerCase() !== currentTest.correctWords[index].toLowerCase() && "bg-red-100 border-red-500"
                                            )}
                                       />
                                   )}
                               </React.Fragment>
                           ))}
                        </div>

                         <div className="flex flex-col items-center gap-4 mt-8">
                            {!isSubmitted ? ( <Button onClick={handleSubmit} size="lg">Submit Answers</Button> ) : (
                                <div className="w-full space-y-6">
                                     <Button onClick={handleRetry} size="lg" variant="outline" className="w-full"><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
