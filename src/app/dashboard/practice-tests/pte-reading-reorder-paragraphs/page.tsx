'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pteReadingReorderParagraphsData } from '@/lib/pte-reading-reorder-paragraphs-data';
import { Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

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

export default function PteReadingReorderParagraphsPage() {
    const [currentTest] = useState(pteReadingReorderParagraphsData[0]);
    const [items, setItems] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        setItems(shuffle([...currentTest.paragraphs]));
    }, [currentTest]);

    const handleSubmit = () => setIsSubmitted(true);
    const handleRetry = () => {
        setIsSubmitted(false);
        setItems(shuffle([...currentTest.paragraphs]));
    };

    const isCorrect = isSubmitted && JSON.stringify(items) === JSON.stringify(currentTest.paragraphs);

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Reading: Re-order Paragraphs</CardTitle>
                        <CardDescription>The text boxes below are in the wrong order. Restore the original order.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 my-8 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-4">{currentTest.title}</h3>
                            <Reorder.Group axis="y" values={items} onReorder={setItems}>
                                <div className="space-y-3">
                                    {items.map((item) => (
                                        <Reorder.Item key={item} value={item} className="p-4 bg-background rounded-lg shadow-sm cursor-grab active:cursor-grabbing flex items-center gap-4">
                                            <GripVertical className="h-5 w-5 text-muted-foreground" />
                                            <span>{item}</span>
                                        </Reorder.Item>
                                    ))}
                                </div>
                            </Reorder.Group>
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            {!isSubmitted ? (
                                <Button onClick={handleSubmit} size="lg" disabled={items.length === 0}>Submit Order</Button>
                            ) : (
                                <div className="w-full space-y-6 text-center">
                                    {isCorrect ? (
                                        <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
                                            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                                            <h3 className="text-xl font-bold text-green-800">Correct!</h3>
                                            <p className="text-muted-foreground">You have arranged the paragraphs in the correct order.</p>
                                        </div>
                                    ) : (
                                         <div className="p-4 bg-red-500/10 border border-red-500 rounded-lg">
                                            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                                            <h3 className="text-xl font-bold text-red-800">Incorrect</h3>
                                            <p className="text-muted-foreground">That's not the right order. The correct sequence is shown below.</p>
                                            <div className="mt-4 text-left space-y-2">
                                                {currentTest.paragraphs.map((p, i) => <div key={i} className="p-2 bg-background/50 rounded-md"><strong>{i + 1}:</strong> {p}</div>)}
                                            </div>
                                        </div>
                                    )}
                                    <Button onClick={handleRetry} size="lg" variant="outline" className="w-full max-w-sm">
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
