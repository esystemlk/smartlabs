'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, PlayCircle, Volume2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { pteListeningHighlightIncorrectWordsData } from '@/lib/pte-listening-highlight-incorrect-words-data';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function PteListeningHighlightIncorrectWordsPage() {
    const [currentTest] = useState(pteListeningHighlightIncorrectWordsData[0]);
    const [selectedWords, setSelectedWords] = useState<string[]>([]);
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
    
    const handleWordClick = (word: string) => {
        if(isSubmitted) return;
        setSelectedWords(prev => 
            prev.includes(word) ? prev.filter(w => w !== word) : [...prev, word]
        );
    }

    const handleSubmit = () => setIsSubmitted(true);
    const handleRetry = () => {
        setSelectedWords([]);
        setIsSubmitted(false);
    };

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Listening: Highlight Incorrect Words</CardTitle>
                        <CardDescription>You will hear a recording and read a transcription. Highlight the words in the transcription that are different from what you hear.</CardDescription>
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
                        
                        <div className="p-6 border rounded-lg leading-loose text-lg">
                            {currentTest.transcript.map((word, index) => {
                                const wordWithPunctuation = word;
                                const cleanWord = word.replace(/[.,]/g, '');
                                const isSelected = selectedWords.includes(cleanWord);
                                const isIncorrect = currentTest.incorrectWords.includes(cleanWord);

                                let wordClass = "cursor-pointer rounded-md px-1";
                                if (isSubmitted) {
                                    if (isSelected && isIncorrect) wordClass = cn(wordClass, 'bg-green-200 text-green-800');
                                    else if (isSelected && !isIncorrect) wordClass = cn(wordClass, 'bg-red-200 text-red-800');
                                    else if (!isSelected && isIncorrect) wordClass = cn(wordClass, 'bg-blue-200 text-blue-800');
                                } else if(isSelected) {
                                    wordClass = cn(wordClass, 'bg-primary/20');
                                }

                                return <span key={index} onClick={() => handleWordClick(cleanWord)} className={wordClass}>{wordWithPunctuation} </span>;
                            })}
                        </div>
                        
                        <div className="flex flex-col items-center gap-4 mt-8">
                            {!isSubmitted ? ( <Button onClick={handleSubmit} size="lg">Submit Answers</Button> ) : (
                                <Button onClick={handleRetry} size="lg" variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Try Again</Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
