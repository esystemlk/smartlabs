'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { pteListeningHighlightCorrectSummaryData } from '@/lib/pte-listening-highlight-correct-summary-data';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function PteListeningHighlightCorrectSummaryPage() {
    const [currentTest] = useState(pteListeningHighlightCorrectSummaryData[0]);
    const [selectedSummary, setSelectedSummary] = useState<string>('');
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
    
    const handleSubmit = () => setIsSubmitted(true);
    const handleRetry = () => {
        setSelectedSummary('');
        setIsSubmitted(false);
    };
    
    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Listening: Highlight Correct Summary</CardTitle>
                        <CardDescription>You will hear a recording. Choose the paragraph that best summarizes the recording.</CardDescription>
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
                        
                        <RadioGroup value={selectedSummary} onValueChange={setSelectedSummary} disabled={isSubmitted} className="space-y-3">
                            {currentTest.summaries.map((summary) => {
                                let state: 'correct' | 'incorrect' | 'default' = 'default';
                                if (isSubmitted) {
                                    if(summary.id === currentTest.correctSummaryId) state = 'correct';
                                    else if(summary.id === selectedSummary) state = 'incorrect';
                                }
                                
                                return (
                                    <div key={summary.id} className={cn("flex items-start space-x-3 p-3 rounded-md border", 
                                        state === 'correct' && "border-green-500 bg-green-500/10",
                                        state === 'incorrect' && "border-red-500 bg-red-500/10"
                                    )}>
                                        <RadioGroupItem value={summary.id} id={summary.id} />
                                        <Label htmlFor={summary.id} className="flex-1 cursor-pointer">{summary.text}</Label>
                                    </div>
                                );
                            })}
                        </RadioGroup>

                        <div className="flex flex-col items-center gap-4 mt-8">
                            {!isSubmitted ? ( <Button onClick={handleSubmit} size="lg" disabled={!selectedSummary}>Submit Answer</Button> ) : (
                                <Button onClick={handleRetry} size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
