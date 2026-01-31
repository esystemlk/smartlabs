'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle, MousePointerClick, MoveRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pteReadingFillInBlanksDragDropData } from '@/lib/pte-reading-fill-in-blanks-drag-drop-data';
import { cn } from '@/lib/utils';
import { Reorder } from 'framer-motion';

// Function to shuffle an array
const shuffle = (array: any[]) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

export default function PteReadingFillInBlanksDragDropPage() {
    const [currentTest] = useState(pteReadingFillInBlanksDragDropData[0]);
    
    const initialWords = useMemo(() => shuffle([...currentTest.correctWords, ...currentTest.extraWords]), [currentTest]);
    const initialBlanks = useMemo(() => Array(currentTest.correctWords.length).fill(null), [currentTest]);
    
    const [blanks, setBlanks] = useState<(string | null)[]>(initialBlanks);
    const [wordBank, setWordBank] = useState<string[]>(initialWords);
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleWordBankClick = (word: string, index: number) => {
        if (isSubmitted) return;
        const firstEmptyBlankIndex = blanks.findIndex(b => b === null);
        if (firstEmptyBlankIndex !== -1) {
            const newBlanks = [...blanks];
            newBlanks[firstEmptyBlankIndex] = word;
            setBlanks(newBlanks);

            const newWordBank = [...wordBank];
            newWordBank.splice(index, 1);
            setWordBank(newWordBank);
        }
    };
    
    const handleBlankClick = (word: string, index: number) => {
        if (isSubmitted) return;
        const newBlanks = [...blanks];
        newBlanks[index] = null;
        setBlanks(newBlanks);
        setWordBank(prev => [...prev, word]);
    };

    const handleSubmit = () => setIsSubmitted(true);
    
    const handleRetry = () => {
        setBlanks(initialBlanks);
        setWordBank(initialWords);
        setIsSubmitted(false);
    };

    const passageParts = currentTest.passage.split('{BLANK}');

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Reading: Fill in the Blanks (Drag &amp; Drop)</CardTitle>
                        <CardDescription>Fill the gaps in the text by selecting words from the box below.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 my-8 bg-muted/50 rounded-lg text-xl leading-relaxed">
                           {passageParts.map((part, index) => (
                               <span key={index}>
                                   {part}
                                   {index < passageParts.length - 1 && (
                                       <Button
                                            variant="secondary"
                                            className={cn(
                                                "inline-flex w-auto h-auto px-2 py-1 mx-1 text-xl font-semibold border-2 border-dashed border-muted-foreground/50",
                                                blanks[index] && "border-solid border-primary",
                                                isSubmitted && blanks[index] === currentTest.correctWords[index] && "border-green-500 bg-green-500/10 text-green-700",
                                                isSubmitted && blanks[index] !== currentTest.correctWords[index] && "border-red-500 bg-red-500/10 text-red-700"
                                            )}
                                            onClick={() => blanks[index] && handleBlankClick(blanks[index]!, index)}
                                            disabled={isSubmitted}
                                       >
                                            {blanks[index] || <span className="w-24">&nbsp;</span>}
                                       </Button>
                                   )}
                               </span>
                           ))}
                        </div>
                        
                        {!isSubmitted && (
                             <div className="p-4 border rounded-lg">
                                <div className="flex items-center gap-2 text-muted-foreground mb-4">
                                     <MousePointerClick className="h-5 w-5" />
                                     <p className="font-semibold">Click a word to place it in the next available blank.</p>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {wordBank.map((word, index) => (
                                        <Button key={word} variant="outline" onClick={() => handleWordBankClick(word, index)}>
                                            {word}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex flex-col items-center gap-4 mt-8">
                            {!isSubmitted ? (
                                <Button onClick={handleSubmit} size="lg">Submit Answers</Button>
                            ) : (
                                <div className="w-full space-y-6">
                                     <h3 className="text-xl font-semibold text-center">Results</h3>
                                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {blanks.map((answer, index) => {
                                             const isCorrect = answer === currentTest.correctWords[index];
                                             return (
                                                 <Card key={index} className={cn(isCorrect ? 'border-green-500' : 'border-red-500')}>
                                                    <CardHeader className="p-4 flex-row items-center gap-2">
                                                         {isCorrect ? <CheckCircle className="text-green-600 h-5 w-5" /> : <XCircle className="text-red-600 h-5 w-5" />}
                                                         <CardTitle className="text-base">Blank {index + 1}</CardTitle>
                                                    </CardHeader>
                                                     <CardContent className="p-4 pt-0 text-sm">
                                                        <p>Your answer: <span className="font-semibold">{answer || 'N/A'}</span></p>
                                                        {!isCorrect && <p>Correct: <span className="font-semibold">{currentTest.correctWords[index]}</span></p>}
                                                     </CardContent>
                                                 </Card>
                                             )
                                        })}
                                     </div>
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
