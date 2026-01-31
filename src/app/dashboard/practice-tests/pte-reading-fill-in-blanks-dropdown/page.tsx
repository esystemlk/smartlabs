'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, RefreshCw, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { pteReadingFillInBlanksDropdownData } from '@/lib/pte-reading-fill-in-blanks-dropdown-data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export default function PteReadingFillInBlanksDropdownPage() {
    const [currentTest] = useState(pteReadingFillInBlanksDropdownData[0]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const handleSelectChange = (blankId: string, value: string) => {
        setAnswers(prev => ({ ...prev, [blankId]: value }));
    };

    const handleSubmit = () => setIsSubmitted(true);
    const handleRetry = () => {
        setAnswers({});
        setIsSubmitted(false);
    };

    const passageParts = currentTest.passage.split(/(\{\d+\})/g);

    return (
        <div className="w-full">
            <div className="mx-auto max-w-4xl space-y-4">
                <Button asChild variant="ghost"><Link href="/dashboard/practice-tests"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link></Button>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-3xl font-headline">PTE Reading: Fill in the Blanks (Dropdown)</CardTitle>
                        <CardDescription>Select the most appropriate word from the dropdown list to fill the blanks in the text.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="p-6 my-8 bg-muted/50 rounded-lg text-xl leading-relaxed">
                            {passageParts.map((part, index) => {
                                const match = part.match(/\{(\d+)\}/);
                                if (match) {
                                    const blankId = match[1];
                                    const blank = currentTest.blanks.find(b => b.id === blankId);
                                    if (!blank) return part;

                                    const isCorrect = isSubmitted && answers[blankId] === blank.correctAnswer;
                                    const isIncorrect = isSubmitted && answers[blankId] && answers[blankId] !== blank.correctAnswer;

                                    return (
                                        <Select key={index} onValueChange={(value) => handleSelectChange(blankId, value)} value={answers[blankId]} disabled={isSubmitted}>
                                            <SelectTrigger className={cn(
                                                "inline-flex w-auto mx-1 h-8 text-lg font-semibold",
                                                isSubmitted && !answers[blankId] && "border-dashed border-muted-foreground",
                                                isCorrect && "border-green-500 text-green-700",
                                                isIncorrect && "border-red-500 text-red-700"
                                            )}>
                                                <SelectValue placeholder={`[ blank ${blankId} ]`} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {blank.options.map(option => (
                                                    <SelectItem key={option} value={option}>{option}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    );
                                }
                                return <span key={index}>{part}</span>;
                            })}
                        </div>
                        
                        <div className="flex flex-col items-center gap-4">
                            {!isSubmitted ? (
                                <Button onClick={handleSubmit} size="lg">Submit Answers</Button>
                            ) : (
                                <div className="w-full space-y-6">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        {currentTest.blanks.map(blank => {
                                            const isCorrect = answers[blank.id] === blank.correctAnswer;
                                            return (
                                                <Card key={blank.id} className={cn(isCorrect ? 'border-green-500' : 'border-red-500')}>
                                                    <CardHeader className="p-4">
                                                        <CardTitle className="text-base flex items-center gap-2">
                                                            {isCorrect ? <CheckCircle className="text-green-600 h-5 w-5" /> : <XCircle className="text-red-600 h-5 w-5" />}
                                                            Blank {blank.id}
                                                        </CardTitle>
                                                    </CardHeader>
                                                    <CardContent className="p-4 pt-0 text-sm">
                                                        <p>Your answer: <span className="font-semibold">{answers[blank.id] || 'N/A'}</span></p>
                                                        <p>Correct answer: <span className="font-semibold">{blank.correctAnswer}</span></p>
                                                    </CardContent>
                                                </Card>
                                            );
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
