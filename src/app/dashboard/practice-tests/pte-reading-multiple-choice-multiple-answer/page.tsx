'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pteReadingMultipleChoiceMultipleAnswerData } from '@/lib/pte-reading-multiple-choice-multiple-answer-data';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PteReadingMultipleChoiceMultipleAnswerPage() {
    const [currentTest] = useState(pteReadingMultipleChoiceMultipleAnswerData[0]);
    const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);

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
                        <CardTitle className="text-3xl font-headline">PTE Reading: Multiple-Choice, Multiple Answer</CardTitle>
                        <CardDescription>Read the passage and select all the correct responses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 mb-8 bg-muted/50 rounded-lg">
                            <h3 className="font-semibold text-lg mb-2">Reading Passage</h3>
                            <p className="text-muted-foreground whitespace-pre-line leading-relaxed">{currentTest.passage}</p>
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
                                            <Checkbox
                                                id={option}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => handleCheckboxChange(option, !!checked)}
                                                disabled={isSubmitted}
                                            />
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
                                    <Alert>
                                        <Info className="h-4 w-4" />
                                        <AlertTitle>Scoring</AlertTitle>
                                        <AlertDescription>You get 1 point for each correct answer and lose 1 point for each incorrect answer. The minimum score is 0.</AlertDescription>
                                    </Alert>
                                    <Card className="bg-secondary">
                                        <CardHeader>
                                            <CardTitle>Your Result</CardTitle>
                                        </CardHeader>
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
